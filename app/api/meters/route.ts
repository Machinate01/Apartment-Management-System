import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const room_id = searchParams.get('room_id');

  let sql = `SELECT m.*, r.room_number FROM meters m JOIN rooms r ON r.id = m.room_id WHERE 1=1`;
  const args: (string | number)[] = [];
  if (month) { sql += ' AND m.month = ?'; args.push(Number(month)); }
  if (year) { sql += ' AND m.year = ?'; args.push(Number(year)); }
  if (room_id) { sql += ' AND m.room_id = ?'; args.push(Number(room_id)); }
  sql += ' ORDER BY m.year DESC, m.month DESC';

  const result = await db.execute({ sql, args });
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { room_id, month, year, water_prev, water_curr, electricity_prev, electricity_curr, water_rate, electricity_rate } = body;

  try {
    const result = await db.execute({
      sql: `INSERT INTO meters (room_id, month, year, water_prev, water_curr, electricity_prev, electricity_curr, water_rate, electricity_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(room_id, month, year) DO UPDATE SET
          water_prev=excluded.water_prev, water_curr=excluded.water_curr,
          electricity_prev=excluded.electricity_prev, electricity_curr=excluded.electricity_curr,
          water_rate=excluded.water_rate, electricity_rate=excluded.electricity_rate,
          recorded_at=datetime('now','localtime')`,
      args: [room_id, month, year, water_prev, water_curr, electricity_prev, electricity_curr, water_rate || 18, electricity_rate || 8],
    });
    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
