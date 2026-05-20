'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, CheckCircle, X } from 'lucide-react';

interface Room { id: number; room_number: string; status: string; }
interface Parcel {
  id: number; room_id: number; room_number: string;
  tracking: string; sender: string; received_date: string;
  pickup_date?: string; status: string; notes: string; created_at: string;
}

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('waiting');
  const [form, setForm] = useState({
    room_id: '', tracking: '', sender: '',
    received_date: new Date().toISOString().split('T')[0], notes: '',
  });

  const load = () => {
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
    const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
    fetch(`/api/parcels${params}`).then(r => r.json()).then(setParcels);
  };
  useEffect(() => { load(); }, [filterStatus]);

  const save = async () => {
    if (!form.room_id) return;
    await fetch('/api/parcels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, room_id: Number(form.room_id) }),
    });
    setShowModal(false);
    setForm({ room_id: '', tracking: '', sender: '', received_date: new Date().toISOString().split('T')[0], notes: '' });
    load();
  };

  const markPickedUp = async (id: number) => {
    await fetch('/api/parcels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'picked_up', pickup_date: new Date().toISOString().split('T')[0] }),
    });
    load();
  };

  const waitingCount = parcels.filter(p => p.status === 'waiting').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package size={22} /> พัสดุ</h2>
          <p className="text-slate-500 text-sm mt-1">จัดการพัสดุและแจ้งเตือนผู้เช่า</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={15} /> รับพัสดุ
        </button>
      </div>

      {waitingCount > 0 && filterStatus === 'waiting' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
          <Package size={16} className="text-orange-600" />
          <p className="text-orange-700 text-sm font-medium">มีพัสดุรอรับ {waitingCount} รายการ</p>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[['waiting', 'รอรับ'], ['picked_up', 'รับแล้ว'], ['all', 'ทั้งหมด']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['ห้อง', 'Tracking', 'ผู้ส่ง', 'วันรับเข้า', 'วันรับออก', 'สถานะ', 'หมายเหตุ', ''].map(h => (
                <th key={h} className="text-left px-3 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parcels.map(p => (
              <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-semibold">{p.room_number}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{p.tracking || '-'}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.sender || '-'}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.received_date}</td>
                <td className="px-3 py-2.5 text-slate-400 text-xs">{p.pickup_date || '-'}</td>
                <td className="px-3 py-2.5">
                  {p.status === 'waiting'
                    ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">รอรับ</span>
                    : <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">รับแล้ว</span>}
                </td>
                <td className="px-3 py-2.5 text-slate-400 text-xs">{p.notes || '-'}</td>
                <td className="px-3 py-2.5">
                  {p.status === 'waiting' && (
                    <button onClick={() => markPickedUp(p.id)} title="ทำเครื่องหมายรับแล้ว" className="text-green-600 hover:text-green-800">
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {parcels.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">ไม่มีพัสดุ</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">บันทึกรับพัสดุ</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ห้อง *</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}>
                  <option value="">-- เลือกห้อง --</option>
                  {rooms.filter(r => r.status === 'occupied').map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                </select>
              </div>
              {[
                { label: 'หมายเลขพัสดุ / Tracking', key: 'tracking', type: 'text', placeholder: 'EX123456789TH' },
                { label: 'ผู้ส่ง', key: 'sender', type: 'text', placeholder: 'Lazada, Shopee...' },
                { label: 'วันที่รับเข้า', key: 'received_date', type: 'date', placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="เช่น กล่องใหญ่ 2 กล่อง" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">บันทึก</button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
