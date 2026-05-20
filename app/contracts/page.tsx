'use client';

import { useEffect, useState } from 'react';
import { FileSignature, Plus, X, AlertTriangle } from 'lucide-react';

interface Tenant { id: number; name: string; room_id: number | null; status: string; }
interface Room { id: number; room_number: string; }
interface Contract {
  id: number; tenant_id: number; room_id: number;
  tenant_name?: string; tenant_phone?: string; room_number?: string;
  start_date: string; end_date: string;
  rent_price: number; deposit: number; status: string; notes: string;
  created_at: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tenant_id: '', room_id: '', start_date: '', end_date: '', rent_price: '', deposit: '', notes: '' });

  const load = () => {
    fetch('/api/contracts').then(r => r.json()).then(setContracts);
    fetch('/api/tenants').then(r => r.json()).then(setTenants);
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: Number(form.tenant_id), room_id: Number(form.room_id), rent_price: Number(form.rent_price), deposit: Number(form.deposit) }),
    });
    setShowModal(false);
    setForm({ tenant_id: '', room_id: '', start_date: '', end_date: '', rent_price: '', deposit: '', notes: '' });
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/contracts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };

  const daysLeft = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const statusBadge = (c: Contract) => {
    if (c.status === 'terminated') return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">ยกเลิก</span>;
    if (c.status === 'expired') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">หมดอายุ</span>;
    const days = daysLeft(c.end_date);
    if (days <= 0) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">หมดอายุแล้ว</span>;
    if (days <= 30) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">ใกล้หมด ({days} วัน)</span>;
    return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">มีผลบังคับ</span>;
  };

  const expiring = contracts.filter(c => c.status === 'active' && daysLeft(c.end_date) <= 30 && daysLeft(c.end_date) > 0);

  const activeTenants = tenants.filter(t => t.status === 'active');

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileSignature size={22} /> สัญญาเช่า</h2>
          <p className="text-slate-500 text-sm mt-1">จัดการสัญญาเช่าและต่อสัญญา</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={15} /> สร้างสัญญา
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800">สัญญาใกล้หมดอายุ {expiring.length} ฉบับ</p>
            <p className="text-yellow-700 text-sm mt-0.5">{expiring.map(c => `ห้อง ${c.room_number} (${daysLeft(c.end_date)} วัน)`).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['ผู้เช่า', 'ห้อง', 'วันเริ่ม', 'วันสิ้นสุด', 'ค่าเช่า', 'มัดจำ', 'สถานะ', 'หมายเหตุ', ''].map(h => (
                <th key={h} className="text-left px-3 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium">{c.tenant_name || '-'}</td>
                <td className="px-3 py-2.5">{c.room_number || '-'}</td>
                <td className="px-3 py-2.5 text-slate-500">{c.start_date}</td>
                <td className="px-3 py-2.5 text-slate-500">{c.end_date}</td>
                <td className="px-3 py-2.5">฿{c.rent_price.toLocaleString()}</td>
                <td className="px-3 py-2.5">฿{c.deposit.toLocaleString()}</td>
                <td className="px-3 py-2.5">{statusBadge(c)}</td>
                <td className="px-3 py-2.5 text-slate-400 text-xs max-w-24 truncate">{c.notes || '-'}</td>
                <td className="px-3 py-2.5">
                  {c.status === 'active' && (
                    <button onClick={() => updateStatus(c.id, 'terminated')}
                      className="text-xs text-red-500 hover:text-red-700 underline">ยกเลิก</button>
                  )}
                </td>
              </tr>
            ))}
            {contracts.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">ยังไม่มีสัญญา</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">สร้างสัญญาเช่าใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ผู้เช่า *</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}>
                  <option value="">-- เลือกผู้เช่า --</option>
                  {activeTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ห้อง *</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}>
                  <option value="">-- เลือกห้อง --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                </select>
              </div>
              {[
                { label: 'วันเริ่มสัญญา *', key: 'start_date', type: 'date' },
                { label: 'วันสิ้นสุดสัญญา *', key: 'end_date', type: 'date' },
                { label: 'ค่าเช่า (฿/เดือน)', key: 'rent_price', type: 'number' },
                { label: 'เงินมัดจำ (฿)', key: 'deposit', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input type={type} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">สร้างสัญญา</button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
