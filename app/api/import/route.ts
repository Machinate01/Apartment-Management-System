import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObject } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const db = await getDb();
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const results = { rooms: 0, tenants: 0, meters: 0, errors: [] as string[] };

  // Find meter sheet (บันทึกมิเตอร์)
  const meterSheet = workbook.SheetNames.find(n => n.includes('มิเตอร์') || n.includes('meter') || n.toLowerCase().includes('meter'));
  if (!meterSheet) return NextResponse.json({ error: 'ไม่พบ sheet บันทึกมิเตอร์' }, { status: 400 });

  const ws = workbook.Sheets[meterSheet];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  // Find header row (look for row with ห้องที่ or similar)
  let headerRow = -1;
  let dataStartRow = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i] as string[];
    const rowStr = row.join('');
    if (rowStr.includes('ห้อง') || rowStr.includes('ชื่อ')) {
      headerRow = i;
      dataStartRow = i + 1;
      // Skip merged headers — find the actual column row
      if (i + 1 < data.length) {
        const nextRow = data[i + 1] as string[];
        if (nextRow.some(c => String(c).includes('เก่า') || String(c).includes('ใหม่'))) {
          dataStartRow = i + 2;
        }
      }
      break;
    }
  }
  if (dataStartRow < 0) dataStartRow = 5; // default fallback

  // Get month/year from sheet (look for date cell)
  const now = new Date();
  let importMonth = now.getMonth() + 1;
  let importYear = now.getFullYear();
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i] as string[];
    for (const cell of row) {
      const s = String(cell);
      if (s.includes('2568') || s.includes('2569') || s.includes('2570')) {
        const yearMatch = s.match(/25(\d{2})/);
        if (yearMatch) importYear = 2500 + parseInt(yearMatch[1]) - 543;
      }
      const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      const mIdx = thMonths.findIndex(m => s.includes(m));
      if (mIdx >= 0) importMonth = mIdx + 1;
    }
  }

  // Get settings for rates
  const settingsResult = await db.execute('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  for (const row of settingsResult.rows) { settings[String(row[0])] = String(row[1]); }
  const elecRate = parseFloat(settings.electricity_rate || '10');
  const waterRate = parseFloat(settings.water_rate || '20');
  const defaultRent = parseFloat(settings.default_rent || '2000');

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i] as (string | number)[];
    const rawRoom = String(row[0] || '').trim();
    if (!rawRoom || typeof row[0] === 'undefined') continue;
    if (rawRoom.toLowerCase().includes('รวม') || rawRoom.toLowerCase().includes('total')) break;

    // Extract numeric part from room number (handles "ห้อง 01", "01", "1", etc.)
    const numericMatch = rawRoom.match(/\d+/);
    if (!numericMatch) continue;
    const roomInt = parseInt(numericMatch[0]);
    if (isNaN(roomInt) || roomInt <= 0 || roomInt > 200) continue;

    const tenantName = String(row[1] || '').trim();
    const elecPrev = parseFloat(String(row[2] || '0')) || 0;
    const elecCurr = parseFloat(String(row[3] || '0')) || 0;
    const waterPrev = parseFloat(String(row[6] || '0')) || 0;
    const waterCurr = parseFloat(String(row[7] || '0')) || 0;

    // Determine building and floor from room number
    let building = 1, floor = 1;
    if (roomInt >= 1 && roomInt <= 15) { building = 1; floor = 1; }
    else if (roomInt >= 16 && roomInt <= 30) { building = 1; floor = 2; }
    else if (roomInt >= 31) { building = 2; floor = 1; }

    const paddedRoom = String(roomInt).padStart(2, '0');
    await db.execute({
      sql: `INSERT OR IGNORE INTO rooms (room_number, building, floor, rent_price) VALUES (?, ?, ?, ?)`,
      args: [paddedRoom, building, floor, defaultRent],
    });
    const roomRow = toObject(await db.execute({ sql: 'SELECT id FROM rooms WHERE room_number = ?', args: [paddedRoom] })) as { id: number } | null;
    if (!roomRow) continue;
    results.rooms++;

    if (tenantName) {
      const existing = toObject(await db.execute({ sql: `SELECT id FROM tenants WHERE room_id = ? AND status = 'active'`, args: [roomRow.id] }));
      if (!existing) {
        await db.execute({ sql: `INSERT OR IGNORE INTO tenants (name, room_id, status) VALUES (?, ?, 'active')`, args: [tenantName, roomRow.id] });
        await db.execute({ sql: `UPDATE rooms SET status = 'occupied' WHERE id = ?`, args: [roomRow.id] });
        results.tenants++;
      }
    }

    if (elecPrev > 0 || elecCurr > 0 || waterPrev > 0 || waterCurr > 0) {
      await db.execute({
        sql: `INSERT INTO meters (room_id, month, year, water_prev, water_curr, electricity_prev, electricity_curr, water_rate, electricity_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(room_id, month, year) DO UPDATE SET
            water_prev=excluded.water_prev, water_curr=excluded.water_curr,
            electricity_prev=excluded.electricity_prev, electricity_curr=excluded.electricity_curr`,
        args: [roomRow.id, importMonth, importYear, waterPrev, waterCurr, elecPrev, elecCurr, waterRate, elecRate],
      });
      results.meters++;
    }
  }

  return NextResponse.json({ success: true, ...results, month: importMonth, year: importYear });
}
