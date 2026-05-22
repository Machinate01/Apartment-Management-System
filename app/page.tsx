'use client';

import { useEffect, useState } from 'react';
import { Home, Users, Banknote, AlertCircle, Package, FileWarning, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
