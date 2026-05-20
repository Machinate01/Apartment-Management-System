import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let sql = `SELECT p.*, r.room_number FROM parcels p JOIN rooms r ON r.id = p.room_id WHERE 1=1`;
  const args: (string | number)[] = [];
  if (status) { sql += ' AND p.status = ?'; args.push(status); }
  sql += ' ORDER BY p.created_at DESC';

  const result = await db.execute({ sql, args });
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { room_id, tracking, sender, received_date, notes } = body;
  const result = await db.execute({
    sql: `INSERT INTO parcels (room_id, tracking, sender, received_date, notes) VALUES (?, ?, ?, ?, ?)`,
    args: [room_id, tracking || '', sender || '', received_date, notes || ''],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { id, status, pickup_date } = body;
  await db.execute({ sql: `UPDATE parcels SET status=?, pickup_date=? WHERE id=?`, args: [status, pickup_date || null, id] });
  return NextResponse.json({ success: true });
}
