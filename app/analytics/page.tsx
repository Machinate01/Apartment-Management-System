'use client';

import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Bill { month: number; year: number; total: number; status: string; rent: number; water: number; electricity: number; }
interface Room { status: string; }

const MONTHS_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    fetch('/api/bills').then(r => r.json()).then(setBills);
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
  }, []);

  const now = new Date();
  const year = now.getFullYear();

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const paid = bills.filter(b => b.month === m && b.year === year && b.status === 'paid');
    const unpaid = bills.filter(b => b.month === m && b.year === year && b.status !== 'paid');
    return {
      name: MONTHS_TH[m],
      ชำระแล้ว: paid.reduce((s, b) => s + b.total, 0),
      ค้างชำระ: unpaid.reduce((s, b) => s + b.total, 0),
    };
  });

  const allPaid = bills.filter(b => b.status === 'paid');
  const totalRent = allPaid.reduce((s, b) => s + b.rent, 0);
  const totalWater = allPaid.reduce((s, b) => s + b.water, 0);
  const totalElec = allPaid.reduce((s, b) => s + b.electricity, 0);

  const revenueBreakdown = [
    { name: 'ค่าเช่า', value: totalRent },
    { name: 'ค่าน้ำ', value: totalWater },
    { name: 'ค่าไฟ', value: totalElec },
  ].filter(d => d.value > 0);

  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const vacant = rooms.filter(r => r.status === 'vacant').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;
  const occupancyData = [
    { name: 'มีผู้เช่า', value: occupied },
    { name: 'ว่าง', value: vacant },
    { name: 'ซ่อมบำรุง', value: maintenance },
  ].filter(d => d.value > 0);

  const thisYear = bills.filter(b => b.year === year);
  const totalIncome = thisYear.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);
  const totalUnpaid = thisYear.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0);
  const collectionRate = (totalIncome + totalUnpaid) > 0
    ? Math.round((totalIncome / (totalIncome + totalUnpaid)) * 100) : 0;

  const monthlyTrend = monthlyRevenue.map(m => ({
    name: m.name,
    รายได้: m.ชำระแล้ว,
  }));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={22} /> วิเคราะห์ข้อมูล</h2>
        <p className="text-slate-500 text-sm mt-1">ภาพรวมธุรกิจและแนวโน้ม ปี {year}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 text-sm">รายได้รวมปีนี้</p>
          <p className="text-2xl font-bold text-green-600 mt-1">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 text-sm">ยอดค้างชำระ</p>
          <p className="text-2xl font-bold text-red-500 mt-1">฿{totalUnpaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 text-sm">อัตราการเก็บเงิน</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{collectionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">รายได้รายเดือน (ปี {year})</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="ชำระแล้ว" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ค้างชำระ" fill="#fca5a5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">แนวโน้มรายได้</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="รายได้" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">สัดส่วนรายได้</h3>
          {revenueBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {revenueBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {revenueBreakdown.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-medium">฿{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">สถานะห้องพัก</h3>
          {occupancyData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={occupancyData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {occupancyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {occupancyData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-bold">{d.value} ห้อง</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">ยังไม่มีข้อมูลห้อง</div>
          )}
        </div>
      </div>
    </div>
  );
}
