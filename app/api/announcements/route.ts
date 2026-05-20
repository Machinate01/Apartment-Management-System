import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`SELECT * FROM announcements ORDER BY created_at DESC`);
  return NextResponse.json(toObjects(result));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  const { title, message, type, target_type, target_rooms } = body;
  const result = await db.execute({
    sql: `INSERT INTO announcements (title, message, type, target_type, target_rooms) VALUES (?, ?, ?, ?, ?)`,
    args: [title, message, type || 'general', target_type || 'all', JSON.stringify(target_rooms || [])],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await db.execute({ sql: 'DELETE FROM announcements WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}
