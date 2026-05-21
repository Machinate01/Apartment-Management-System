'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Zap, Droplets, Save, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Bill {
  id: number; room_number: string; tenant_name?: string;
  month: number; year: number; rent: number; water: number; electricity: number;
  other: number; other_desc: string; total: number; status: string;
  due_date?: string; paid_date?: string;
}

interface UtilityBill {
  water_bill: number;
  electricity_bill: number;
  notes: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [bills, setBills] = useState<Bill[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Utility bill state
  const [utility, setUtility] = useState<UtilityBill>({ water_bill: 0, electricity_bill: 0, notes: '' });
  const [utilityForm, setUtilityForm] = useState({ water_bill: '', electricity_bill: '', notes: '' });
  const [utilitySaved, setUtilitySaved] = useState(false);
  const [utilitySaving, setUtilitySaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterStatus !== 'all') params.set('status', filterStatus);
    fetch(`/api/bills?${params}`).then(r => r.json()).then(setBills);
  }, [month, year, filterStatus]);

  useEffect(() => {
    fetch(`/api/utility-bills?month=${month}&year=${year}`)
      .then(r => r.json())
      .then((u: UtilityBill) => {
        setUtility(u);
        setUtilityForm({
          water_bill: u.water_bill > 0 ? String(u.water_bill) : '',
          electricity_bill: u.electricity_bill > 0 ? String(u.electricity_bill) : '',
          notes: u.notes || '',
        });
      });
  }, [month, year]);

  const totalIncome = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);
  const totalUnpaid = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0);
  const paidCount = bills.filter(b => b.status === 'paid').length;
  const unpaidCount = bills.filter(b => b.status !== 'paid').length;

  // Utility comparison — use ALL bills (paid + unpaid) for tenant charge totals
  const tenantWater = bills.reduce((s, b) => s + b.water, 0);
  const tenantElec = bills.reduce((s, b) => s + b.electricity, 0);
  const ownerWater = utility.water_bill;
  const ownerElec = utility.electricity_bill;
  const waterProfit = tenantWater - ownerWater;
  const elecProfit = tenantElec - ownerElec;
  const totalUtilityProfit = waterProfit + elecProfit;

  const handleSaveUtility = async () => {
    setUtilitySaving(true);
    const res = await fetch('/api/utility-bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month, year,
        water_bill: Number(utilityForm.water_bill) || 0,
        electricity_bill: Number(utilityForm.electricity_bill) || 0,
        notes: utilityForm.notes,
      }),
    });
    const u: UtilityBill = await res.json();
    setUtility(u);
    setUtilitySaving(false);
    setUtilitySaved(true);
    setTimeout(() => setUtilitySaved(false), 2000);
  };

  const exportCSV = () => {
    const header = 'ห้อง,ผู้เช่า,เดือน,ปี,ค่าเช่า,ค่าน้ำ,ค่าไฟ,อื่นๆ,รวม,สถานะ,วันชำระ';
    const rows = bills.map(b =>
      [b.room_number, b.tenant_name || '', b.month, b.year, b.rent, b.water, b.electricity, b.other, b.total,
        b.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ', b.paid_date || ''].join(',')
    );
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงาน_${MONTHS_TH[month]}_${year}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileText size={22} /> รายงานสรุป</h2>
          <p className="text-slate-500 text-sm mt-1">สรุปรายได้และการชำระเงิน</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
          <Download size={15} /> CSV
        </button>
      </div>

      {/* Month/Year filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{MONTHS_TH[m]}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[['all', 'ทั้งหมด'], ['paid', 'ชำระแล้ว'], ['unpaid', 'ยังไม่ชำระ']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filterStatus === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Income summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'รายได้รับแล้ว', value: `฿${totalIncome.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ยอดค้างชำระ', value: `฿${totalUnpaid.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'ชำระแล้ว', value: `${paidCount} ห้อง`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'ค้างชำระ', value: `${unpaidCount} ห้อง`, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ─── UTILITY BILL SECTION ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-base font-semibold text-slate-700">💡 บิลน้ำ-ไฟรวม (เจ้าของจ่าย)</span>
          <span className="ml-auto text-xs text-slate-400">{MONTHS_TH[month]} {year}</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Input form */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">กรอกยอดที่จ่ายจริง</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Droplets size={11} className="text-blue-500" /> ค่าน้ำ (฿)
                </label>
                <input
                  type="number" inputMode="numeric" min="0" placeholder="0"
                  value={utilityForm.water_bill}
                  onChange={e => setUtilityForm(f => ({ ...f, water_bill: e.target.value }))}
                  className="w-full border border-blue-200 rounded-xl px-3 py-3 text-base font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Zap size={11} className="text-orange-500" /> ค่าไฟ (฿)
                </label>
                <input
                  type="number" inputMode="numeric" min="0" placeholder="0"
                  value={utilityForm.electricity_bill}
                  onChange={e => setUtilityForm(f => ({ ...f, electricity_bill: e.target.value }))}
                  className="w-full border border-orange-200 rounded-xl px-3 py-3 text-base font-semibold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">หมายเหตุ (ไม่บังคับ)</label>
              <input
                type="text" placeholder="เช่น เลขมิเตอร์รวม, รอบบิล..."
                value={utilityForm.notes}
                onChange={e => setUtilityForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <button
              onClick={handleSaveUtility}
              disabled={utilitySaving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                utilitySaved ? 'bg-green-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95'
              }`}>
              <Save size={15} />
              {utilitySaved ? '✓ บันทึกแล้ว' : utilitySaving ? 'กำลังบันทึก...' : 'บันทึกยอดค่าน้ำ-ไฟ'}
            </button>
          </div>

          {/* Comparison */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เปรียบเทียบ</p>

            {/* Water */}
            <UtilityRow
              icon={<Droplets size={15} className="text-blue-500" />}
              label="ค่าน้ำ"
              collected={tenantWater}
              paid={ownerWater}
              profit={waterProfit}
              color="blue"
            />

            {/* Electricity */}
            <UtilityRow
              icon={<Zap size={15} className="text-orange-500" />}
              label="ค่าไฟ"
              collected={tenantElec}
              paid={ownerElec}
              profit={elecProfit}
              color="orange"
            />

            {/* Total */}
            <div className={`rounded-xl p-3 flex items-center justify-between ${
              totalUtilityProfit > 0 ? 'bg-green-50' : totalUtilityProfit < 0 ? 'bg-red-50' : 'bg-slate-50'
            }`}>
              <span className="text-sm font-bold text-slate-700">รวมกำไร/ขาดทุนสาธารณูปโภค</span>
              <div className="flex items-center gap-1.5">
                {totalUtilityProfit > 0
                  ? <TrendingUp size={15} className="text-green-600" />
                  : totalUtilityProfit < 0
                    ? <TrendingDown size={15} className="text-red-500" />
                    : <Minus size={15} className="text-slate-400" />}
                <span className={`text-lg font-bold ${
                  totalUtilityProfit > 0 ? 'text-green-600' : totalUtilityProfit < 0 ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {totalUtilityProfit >= 0 ? '+' : ''}฿{totalUtilityProfit.toLocaleString()}
                </span>
              </div>
            </div>

            {(ownerWater === 0 && ownerElec === 0) && (
              <p className="text-xs text-slate-400 text-center">← กรอกยอดที่จ่ายจริงทางซ้ายเพื่อเปรียบเทียบ</p>
            )}
          </div>
        </div>
      </div>

      {/* Bills table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">รายงาน {MONTHS_TH[month]} {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50">
              <tr>
                {['ห้อง', 'ผู้เช่า', 'ค่าเช่า', 'ค่าน้ำ', 'ค่าไฟ', 'อื่นๆ', 'รวม', 'สถานะ', 'วันชำระ'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold">{b.room_number}</td>
                  <td className="px-3 py-2.5 text-slate-500">{b.tenant_name || '-'}</td>
                  <td className="px-3 py-2.5">฿{b.rent.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-blue-600">฿{b.water.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-orange-600">฿{b.electricity.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-500">฿{b.other.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-bold">฿{b.total.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    {b.status === 'paid'
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">ชำระแล้ว</span>
                      : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">ค้างชำระ</span>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{b.paid_date || '-'}</td>
                </tr>
              ))}
              {bills.length > 0 && (
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td className="px-3 py-3" colSpan={2}>รวม</td>
                  <td className="px-3 py-3">฿{bills.reduce((s, b) => s + b.rent, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-blue-600">฿{tenantWater.toLocaleString()}</td>
                  <td className="px-3 py-3 text-orange-600">฿{tenantElec.toLocaleString()}</td>
                  <td className="px-3 py-3">฿{bills.reduce((s, b) => s + b.other, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-blue-700">฿{bills.reduce((s, b) => s + b.total, 0).toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              )}
              {bills.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UtilityRow({ icon, label, collected, paid, profit, color }: {
  icon: React.ReactNode; label: string; collected: number; paid: number; profit: number; color: 'blue' | 'orange';
}) {
  const isProfit = profit > 0;
  const isLoss = profit < 0;
  const borderColor = color === 'blue' ? 'border-blue-100' : 'border-orange-100';
  const bgColor = color === 'blue' ? 'bg-blue-50/50' : 'bg-orange-50/50';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-3 space-y-2`}>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        {icon} {label}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-slate-400 mb-0.5">เก็บจากผู้เช่า</p>
          <p className={`font-bold ${color === 'blue' ? 'text-blue-600' : 'text-orange-600'}`}>฿{collected.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">จ่ายจริง</p>
          <p className="font-bold text-slate-700">฿{paid.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">กำไร/ขาดทุน</p>
          <p className={`font-bold ${isProfit ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-slate-400'}`}>
            {profit >= 0 ? '+' : ''}฿{profit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
