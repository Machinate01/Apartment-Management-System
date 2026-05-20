import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjects } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute('SELECT key, value FROM settings');
  const rows = toObjects(result) as { key: string; value: string }[];
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}

export async function PUT(req: NextRequest) {
  const db = await getDb();
  const body = await req.json();
  await db.batch(
    Object.entries(body).map(([k, v]) => ({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      args: [k, String(v)],
    })),
    'write'
  );
  return NextResponse.json({ success: true });
}
