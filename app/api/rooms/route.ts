import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects, toObject } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`
    SELECT r.*, t.name as tenant_name, t.phone as tenant_phone
    FROM rooms r
    LEFT JOIN tenants t ON t.room_id = r.id AND t.status = 'active'
    ORDER BY r.building, r.floor, r.room_number
  `);
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { room_number, building, floor, type, rent_price } = body;
  try {
    const result = await db.execute({
      sql: `INSERT INTO rooms (room_number, building, floor, type, rent_price) VALUES (?, ?, ?, ?, ?)`,
      args: [room_number, building || 1, floor || 1, type || 'standard', rent_price],
    });
    const room = toObject(await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [Number(result.lastInsertRowid)] }));
    return NextResponse.json(room, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'เลขห้องซ้ำ' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { id, room_number, building, floor, type, rent_price, status } = body;
  await db.execute({
    sql: `UPDATE rooms SET room_number=?, building=?, floor=?, type=?, rent_price=?, status=? WHERE id=?`,
    args: [room_number, building ?? 1, floor, type, rent_price, status, id],
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await db.execute({ sql: 'DELETE FROM rooms WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}
