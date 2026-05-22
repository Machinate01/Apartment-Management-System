'use client';

import { useEffect, useState } from 'react';
import { Home, Users, Banknote, AlertCircle, Package, FileWarning, TrendingUp, Phone } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface OverdueRoom {
  room_id: number;
  room_number: string;
  tenant_name?: string;
  tenant_phone?: string;
  months_unpaid: number;
  total_owed: number;
  since_month: number;
  since_year: number;
}

interface DashboardData {
  totalRooms: number;
  occupied: number;
  vacant: number;
  revenue: number;
  unpaidCount: number;
  unpaidAmount: number;
  waitingParcels: number;
  expiringContracts: number;
  revenueByMonth: { month: number; year: number; total: number }[];
  overdueRooms: OverdueRoom[];
  currentMonth: number;
  currentYear: number;
}

const MONTHS_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-400">กำลังโหลด...</div>
    </div>
  );

  const occupancyRate = data.totalRooms > 0 ? Math.round((data.occupied / data.totalRooms) * 100) : 0;
  const chartData = data.revenueByMonth.map(r => ({
    name: `${MONTHS_TH[r.month]}`,
    รายได้: r.total,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">แดชบอร์ด</h2>
        <p className="text-slate-500 text-sm mt-1">ภาพรวมระบบห้องเช่า</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="ห้องทั้งหมด" value={data.totalRooms} icon={Home} color="blue" sub={`อัตราเข้าพัก ${occupancyRate}%`} />
        <StatCard label="ห้องมีผู้เช่า" value={data.occupied} icon={Users} color="green" sub={`ว่าง ${data.vacant} ห้อง`} />
        <StatCard label="รายได้เดือนนี้" value={`฿${data.revenue.toLocaleString()}`} icon={Banknote} color="emerald" sub={`${MONTHS_TH[data.currentMonth]} ${data.currentYear}`} />
        <StatCard label="ค้างชำระ" value={data.unpaidCount} icon={AlertCircle} color="red" sub={`฿${data.unpaidAmount.toLocaleString()}`} />
        <StatCard label="พัสดุรอรับ" value={data.waitingParcels} icon={Package} color="orange" sub="รายการรอรับ" />
        <StatCard label="สัญญาใกล้หมด" value={data.expiringContracts} icon={FileWarning} color="yellow" sub="ภายใน 30 วัน" />
      </div>

      {/* ค้างชำระ panel */}
      {data.overdueRooms && data.overdueRooms.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-red-500" />
              <span className="font-semibold text-red-700">ค้างชำระ {data.overdueRooms.length} ห้อง</span>
            </div>
            <span className="text-sm font-bold text-red-600">฿{data.unpaidAmount.toLocaleString()}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {data.overdueRooms.map(r => (
              <div key={r.room_id} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {r.room_number}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.tenant_name || <span className="text-slate-400 italic text-xs">ไม่มีชื่อ</span>}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.months_unpaid > 1 && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">ค้าง {r.months_unpaid} เดือน</span>
                      )}
                      <span className="text-xs text-slate-400">ตั้งแต่ {MONTHS_TH[r.since_month]} {r.since_year}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.tenant_phone && (
                    <a href={`tel:${r.tenant_phone}`} className="text-slate-400 hover:text-blue-600">
                      <Phone size={15} />
                    </a>
                  )}
                  <span className="text-sm font-bold text-red-600">฿{Number(r.total_owed).toLocaleString()}</span>
                  <Link href={`/billing`} className="text-xs bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-800">
                    ดูบิล
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-700">รายได้รายเดือน</h3>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `฿${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`฿${Number(v).toLocaleString()}`, 'รายได้']} />
              <Bar dataKey="รายได้" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
            ยังไม่มีข้อมูลรายได้
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
