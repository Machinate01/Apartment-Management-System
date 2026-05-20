import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects, toObject } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`
    SELECT t.*, r.room_number FROM tenants t
    LEFT JOIN rooms r ON r.id = t.room_id
    ORDER BY t.created_at DESC
  `);
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { name, phone, email, id_card, room_id, start_date, end_date, deposit } = body;

  const result = await db.execute({
    sql: `INSERT INTO tenants (name, phone, email, id_card, room_id, start_date, end_date, deposit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [name, phone || null, email || null, id_card || null, room_id || null, start_date || null, end_date || null, deposit || 0],
  });

  if (room_id) {
    await db.execute({ sql: `UPDATE rooms SET status = 'occupied' WHERE id = ?`, args: [room_id] });
  }
  const tenant = toObject(await db.execute({ sql: 'SELECT * FROM tenants WHERE id = ?', args: [Number(result.lastInsertRowid)] }));
  return NextResponse.json(tenant, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { id, name, phone, email, id_card, room_id, start_date, end_date, deposit, status } = body;

  const old = toObject(await db.execute({ sql: 'SELECT room_id FROM tenants WHERE id = ?', args: [id] }));
  if (old?.room_id && old.room_id !== room_id) {
    await db.execute({ sql: `UPDATE rooms SET status = 'vacant' WHERE id = ?`, args: [old.room_id] });
  }
  if (room_id) {
    await db.execute({
      sql: `UPDATE rooms SET status = ? WHERE id = ?`,
      args: [status === 'active' ? 'occupied' : 'vacant', room_id],
    });
  }

  await db.execute({
    sql: `UPDATE tenants SET name=?, phone=?, email=?, id_card=?, room_id=?, start_date=?, end_date=?, deposit=?, status=? WHERE id=?`,
    args: [name, phone || null, email || null, id_card || null, room_id || null, start_date || null, end_date || null, deposit, status, id],
  });

  return NextResponse.json({ success: true });
}
