import { NextResponse } from 'next/server';
import { getDb, toObject, toObjects } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [roomStats, revenue, unpaid, parcels, contracts, revenueByMonth] = await Promise.all([
    db.execute(`SELECT
      COUNT(*) as totalRooms,
      SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) as occupied,
      SUM(CASE WHEN status='vacant' THEN 1 ELSE 0 END) as vacant
      FROM rooms`),
    db.execute({ sql: `SELECT COALESCE(SUM(total),0) as total FROM bills WHERE month=? AND year=? AND status='paid'`, args: [month, year] }),
    db.execute(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as amount FROM bills WHERE status='unpaid'`),
    db.execute(`SELECT COUNT(*) as c FROM parcels WHERE status='waiting'`),
    db.execute(`SELECT COUNT(*) as c FROM contracts WHERE status='active' AND date(end_date) <= date('now','+30 days')`),
    db.execute({ sql: `SELECT month, year, SUM(total) as total FROM bills WHERE status='paid' AND year >= ? GROUP BY year, month ORDER BY year, month`, args: [year - 1] }),
  ]);

  const rs = toObject(roomStats) as { totalRooms: number; occupied: number; vacant: number };
  const rev = toObject(revenue) as { total: number };
  const unp = toObject(unpaid) as { c: number; amount: number };
  const par = toObject(parcels) as { c: number };
  const con = toObject(contracts) as { c: number };

  return NextResponse.json({
    totalRooms: Number(rs.totalRooms),
    occupied: Number(rs.occupied),
    vacant: Number(rs.vacant),
    revenue: Number(rev.total),
    unpaidCount: Number(unp.c),
    unpaidAmount: Number(unp.amount),
    waitingParcels: Number(par.c),
    expiringContracts: Number(con.c),
    revenueByMonth: toObjects(revenueByMonth),
    currentMonth: month,
    currentYear: year,
  });
}
