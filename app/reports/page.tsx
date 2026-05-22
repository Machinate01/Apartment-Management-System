'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';

interface Bill {
  id: number; room_number: string; tenant_name?: string;
  month: number; year: number; rent: number; water: number; electricity: number;
  other: number; other_desc: string; total: number; status: string;
  due_date?: string; paid_date?: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [bills, setBills] = useState<Bill[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterStatus !== 'all') params.set('status', filterStatus);
    fetch(`/api/bills?${params}`).then(r => r.json()).then(setBills);
  }, [month, year, filterStatus]);

  const totalIncome = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);
  const totalUnpaid = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0);
  const paidCount = bills.filter(b => b.status === 'paid').length;
  const unpaidCount = bills.filter(b => b.status !== 'paid').length;

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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileText size={22} /> รายงานสรุป</h2>
          <p className="text-slate-500 text-sm mt-1">สรุปรายได้และการชำระเงิน</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
          <Download size={15} /> Export CSV
        </button>
      </div>

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

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'รายได้รับแล้ว', value: `฿${totalIncome.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ยอดค้างชำระ', value: `฿${totalUnpaid.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'จำนวนชำระแล้ว', value: `${paidCount} รายการ`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'ค้างชำระ', value: `${unpaidCount} รายการ`, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">รายงาน {MONTHS_TH[month]} {year}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['ห้อง', 'ผู้เช่า', 'ค่าเช่า', 'ค่าน้ำ', 'ค่าไฟ', 'อื่นๆ', 'รวม', 'สถานะ', 'วันชำระ'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium text-xs">{h}</th>
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
                <td className="px-3 py-3" colSpan={6}>รวม</td>
                <td className="px-3 py-3 text-blue-700">฿{bills.reduce((s, b) => s + b.total, 0).toLocaleString()}</td>
                <td colSpan={2} />
              </tr>
            )}
            {bills.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
