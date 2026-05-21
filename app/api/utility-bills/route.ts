import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObject, toObjects } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (month && year) {
    const row = toObject(await db.execute({
      sql: 'SELECT * FROM utility_bills WHERE month=? AND year=?',
      args: [Number(month), Number(year)],
    }));
    return NextResponse.json(row ?? { water_bill: 0, electricity_bill: 0, notes: '' });
  }

  // Return last 12 months for history
  const rows = toObjects(await db.execute(
    'SELECT * FROM utility_bills ORDER BY year DESC, month DESC LIMIT 12'
  ));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const { month, year, water_bill, electricity_bill, notes } = await req.json();

  await db.execute({
    sql: `INSERT INTO utility_bills (month, year, water_bill, electricity_bill, notes)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(month, year) DO UPDATE SET
            water_bill=excluded.water_bill,
            electricity_bill=excluded.electricity_bill,
            notes=excluded.notes`,
    args: [month, year, water_bill ?? 0, electricity_bill ?? 0, notes ?? ''],
  });

  const row = toObject(await db.execute({
    sql: 'SELECT * FROM utility_bills WHERE month=? AND year=?',
    args: [month, year],
  }));
  return NextResponse.json(row);
}
