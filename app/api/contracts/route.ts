import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`
    SELECT c.*, t.name as tenant_name, t.phone as tenant_phone, r.room_number
    FROM contracts c
    LEFT JOIN tenants t ON t.id = c.tenant_id
    LEFT JOIN rooms r ON r.id = c.room_id
    ORDER BY c.created_at DESC
  `);
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { tenant_id, room_id, start_date, end_date, rent_price, deposit, notes } = body;
  const result = await db.execute({
    sql: `INSERT INTO contracts (tenant_id, room_id, start_date, end_date, rent_price, deposit, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [tenant_id, room_id, start_date, end_date, rent_price, deposit || 0, notes || ''],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { id, status } = body;
  await db.execute({ sql: `UPDATE contracts SET status=? WHERE id=?`, args: [status, id] });
  return NextResponse.json({ success: true });
}
