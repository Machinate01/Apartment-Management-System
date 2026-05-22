import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const status = searchParams.get('status');

  let sql = `SELECT b.*, r.room_number, t.name as tenant_name
    FROM bills b JOIN rooms r ON r.id = b.room_id
    LEFT JOIN tenants t ON t.room_id = b.room_id AND t.status = 'active' WHERE 1=1`;
  const args: (string | number)[] = [];
  if (month) { sql += ' AND b.month = ?'; args.push(Number(month)); }
  if (year) { sql += ' AND b.year = ?'; args.push(Number(year)); }
  if (status) { sql += ' AND b.status = ?'; args.push(status); }
  sql += ' ORDER BY b.year DESC, b.month DESC, r.room_number';

  const result = await db.execute({ sql, args });
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { room_id, month, year, rent, water, electricity, other, other_desc, due_date } = body;
  const total = (rent || 0) + (water || 0) + (electricity || 0) + (other || 0);

  try {
    await db.execute({
      sql: `INSERT INTO bills (room_id, month, year, rent, water, electricity, other, other_desc, total, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(room_id, month, year) DO UPDATE SET
          rent=excluded.rent, water=excluded.water, electricity=excluded.electricity,
          other=excluded.other, other_desc=excluded.other_desc, total=excluded.total, due_date=excluded.due_date`,
      args: [room_id, month, year, rent || 0, water || 0, electricity || 0, other || 0, other_desc || '', total, due_date || null],
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { id, status, paid_date } = body;
  await db.execute({ sql: `UPDATE bills SET status=?, paid_date=? WHERE id=?`, args: [status, paid_date || null, id] });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await db.execute({ sql: 'DELETE FROM bills WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}
