'use client';

import { useEffect, useState } from 'react';
import { Receipt, Plus, CheckCircle, X, Printer } from 'lucide-react';
import Link from 'next/link';

interface Room { id: number; room_number: string; rent_price: number; status: string; tenant_name?: string; }
interface Meter { room_id: number; water_prev: number; water_curr: number; electricity_prev: number; electricity_curr: number; water_rate: number; electricity_rate: number; }
interface Bill {
  id: number; room_id: number; room_number: string; tenant_name?: string;
  month: number; year: number; rent: number; water: number; electricity: number;
  other: number; other_desc: string; total: number; status: string; due_date?: string; paid_date?: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function BillingPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ room_id: '', other: '0', other_desc: '', due_date: '' });

  const load = () => {
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
    fetch(`/api/bills?month=${month}&year=${year}`).then(r => r.json()).then(setBills);
    fetch(`/api/meters?month=${month}&year=${year}`).then(r => r.json()).then(setMeters);
  };

  useEffect(() => { load(); }, [month, year]);

  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const selectedMeter = meters.find(m => m.room_id === Number(form.room_id));
  const waterCost = selectedMeter ? (selectedMeter.water_curr - selectedMeter.water_prev) * selectedMeter.water_rate : 0;
  const elecCost = selectedMeter ? (selectedMeter.electricity_curr - selectedMeter.electricity_prev) * selectedMeter.electricity_rate : 0;
  const total = (selectedRoom?.rent_price || 0) + waterCost + elecCost + Number(form.other);

  const createBill = async () => {
    if (!form.room_id) return;
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: Number(form.room_id), month, year,
        rent: selectedRoom?.rent_price || 0,
        water: waterCost, electricity: elecCost,
        other: Number(form.other), other_desc: form.other_desc,
        due_date: form.due_date,
      }),
    });
    setShowCreate(false);
    setForm({ room_id: '', other: '0', other_desc: '', due_date: '' });
    load();
  };

  const generateAll = async () => {
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');
    for (const room of occupiedRooms) {
      const m = meters.find(m => m.room_id === room.id);
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id, month, year,
          rent: room.rent_price,
          water: m ? (m.water_curr - m.water_prev) * m.water_rate : 0,
          electricity: m ? (m.electricity_curr - m.electricity_prev) * m.electricity_rate : 0,
          other: 0, other_desc: '',
        }),
      });
    }
    load();
  };

  const markPaid = async (bill: Bill) => {
    await fetch('/api/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bill.id, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }),
    });
    load();
  };

  const markUnpaid = async (bill: Bill) => {
    await fetch('/api/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bill.id, status: 'unpaid', paid_date: null }),
    });
    load();
  };

  const deleteBill = async (id: number) => {
    await fetch(`/api/bills?id=${id}`, { method: 'DELETE' });
    load();
  };

  const statusBadge = (s: string) => {
    if (s === 'paid') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">ชำระแล้ว</span>;
    if (s === 'overdue') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">เกินกำหนด</span>;
    return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">ยังไม่ชำระ</span>;
  };

  const totalRevenue = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);
  const totalUnpaid = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Receipt size={22} /> ทำบิล</h2>
          <p className="text-slate-500 text-sm mt-1">จัดการบิลค่าเช่าประจำเดือน</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/billing/print?month=${month}&year=${year}`} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800">
            <Printer size={15} /> พิมพ์ใบวางบิล
          </Link>
          <button onClick={generateAll} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700">
            <Plus size={15} /> สร้างบิลทุกห้อง
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus size={15} /> เพิ่มบิล
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{MONTHS_TH[m]}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto flex gap-3 text-sm">
          <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">รับแล้ว ฿{totalRevenue.toLocaleString()}</span>
          <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">ค้าง ฿{totalUnpaid.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['ห้อง', 'ผู้เช่า', 'ค่าเช่า', 'ค่าน้ำ', 'ค่าไฟ', 'อื่นๆ', 'รวม', 'สถานะ', ''].map(h => (
                <th key={h} className="text-left px-3 py-3 text-slate-500 font-medium text-xs">{h}</th>
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
                <td className="px-3 py-2.5 font-bold text-slate-800">฿{b.total.toLocaleString()}</td>
                <td className="px-3 py-2.5">{statusBadge(b.status)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {b.status !== 'paid' ? (
                      <button onClick={() => markPaid(b)} title="ทำเครื่องหมายชำระแล้ว" className="text-green-600 hover:text-green-800"><CheckCircle size={16} /></button>
                    ) : (
                      <button onClick={() => markUnpaid(b)} title="ยกเลิกการชำระ" className="text-slate-400 hover:text-orange-600"><CheckCircle size={16} /></button>
                    )}
                    <button onClick={() => deleteBill(b.id)} className="text-slate-300 hover:text-red-500"><X size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {bills.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">ยังไม่มีบิล กด &quot;สร้างบิลทุกห้อง&quot; เพื่อสร้างอัตโนมัติ</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">เพิ่มบิลใหม่</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ห้อง *</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}>
                  <option value="">-- เลือกห้อง --</option>
                  {rooms.filter(r => r.status === 'occupied').map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                </select>
              </div>
              {selectedRoom && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>ค่าเช่า</span><span>฿{selectedRoom.rent_price.toLocaleString()}</span></div>
                  <div className="flex justify-between text-blue-600"><span>ค่าน้ำ</span><span>฿{waterCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-orange-600"><span>ค่าไฟ</span><span>฿{elecCost.toLocaleString()}</span></div>
                  {!selectedMeter && <p className="text-xs text-amber-600">⚠ ยังไม่ได้จดมิเตอร์เดือนนี้</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ค่าอื่นๆ (฿)</label>
                <input type="number" value={form.other} onChange={e => setForm(f => ({ ...f, other: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดค่าอื่นๆ</label>
                <input type="text" value={form.other_desc} onChange={e => setForm(f => ({ ...f, other_desc: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="เช่น ค่าอินเตอร์เน็ต" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">วันครบกำหนด</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              {selectedRoom && (
                <div className="bg-slate-50 rounded-lg p-3 flex justify-between font-bold text-slate-800">
                  <span>รวมทั้งสิ้น</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={createBill} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">สร้างบิล</button>
                <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
