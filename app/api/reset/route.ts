import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/reset  — ล้างข้อมูล tenant + meter + bill ทั้งหมด, reset room status → vacant
// ห้องยังอยู่ครบ, settings ยังอยู่ครบ
export async function POST() {
  const db = await getDb();

  // 1. ลบบิลทั้งหมด
  await db.execute('DELETE FROM bills');

  // 2. ลบข้อมูลมิเตอร์ทั้งหมด
  await db.execute('DELETE FROM meters');

  // 3. ลบผู้เช่าทั้งหมด
  await db.execute('DELETE FROM tenants');

  // 4. Reset ห้องทั้งหมดเป็น vacant
  await db.execute(`UPDATE rooms SET status = 'vacant'`);

  return NextResponse.json({ success: true, message: 'ล้างข้อมูลสำเร็จ' });
}

// GET /api/reset  — ตรวจสอบและซ่อม room status ที่ค้างอยู่
// (ห้อง occupied แต่ไม่มี active tenant → เปลี่ยนเป็น vacant)
export async function GET() {
  const db = await getDb();

  const result = await db.execute(`
    UPDATE rooms
    SET status = 'vacant'
    WHERE status = 'occupied'
      AND id NOT IN (
        SELECT room_id FROM tenants
        WHERE status = 'active' AND room_id IS NOT NULL
      )
  `);

  const fixed = result.rowsAffected ?? 0;
  return NextResponse.json({ success: true, fixed, message: `ซ่อม ${fixed} ห้อง` });
}
