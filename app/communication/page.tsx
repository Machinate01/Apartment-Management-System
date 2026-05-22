'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2, X } from 'lucide-react';

interface Room { id: number; room_number: string; }
interface Announcement {
  id: number; title: string; message: string;
  type: string; target_type: string; target_rooms: string;
  created_at: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  general: { label: 'ทั่วไป', color: 'bg-blue-100 text-blue-700' },
  urgent: { label: 'ด่วน', color: 'bg-red-100 text-red-700' },
  bill: { label: 'บิล/การเงิน', color: 'bg-yellow-100 text-yellow-700' },
  parcel: { label: 'พัสดุ', color: 'bg-orange-100 text-orange-700' },
  maintenance: { label: 'ซ่อมบำรุง', color: 'bg-purple-100 text-purple-700' },
};

export default function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', type: 'general', target_type: 'all', target_rooms: [] as number[],
  });

  const load = () => {
    fetch('/api/announcements').then(r => r.json()).then(setAnnouncements);
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!form.title || !form.message) return;
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ title: '', message: '', type: 'general', target_type: 'all', target_rooms: [] });
    load();
  };

  const deleteAnnouncement = async (id: number) => {
    await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    load();
  };

  const toggleRoom = (id: number) => {
    setForm(f => ({
      ...f,
      target_rooms: f.target_rooms.includes(id)
        ? f.target_rooms.filter(r => r !== id)
        : [...f.target_rooms, id],
    }));
  };

  const getTargetLabel = (a: Announcement) => {
    if (a.target_type === 'all') return 'ทุกห้อง';
    const ids: number[] = JSON.parse(a.target_rooms || '[]');
    const numbers = ids.map(id => rooms.find(r => r.id === id)?.room_number).filter(Boolean);
    return numbers.length > 0 ? `ห้อง ${numbers.join(', ')}` : 'ห้องที่เลือก';
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={22} /> สื่อสารกับผู้เช่า</h2>
          <p className="text-slate-500 text-sm mt-1">ส่งประกาศและข้อความถึงผู้เช่า</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Send size={15} /> ส่งประกาศ
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map(a => {
          const t = TYPE_LABEL[a.type] || TYPE_LABEL.general;
          return (
            <div key={a.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.color}`}>{t.label}</span>
                    <span className="text-xs text-slate-400">{getTargetLabel(a)}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{a.created_at?.split(' ')[0]}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800">{a.title}</h4>
                  <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{a.message}</p>
                </div>
                <button onClick={() => deleteAnnouncement(a.id)} className="text-slate-300 hover:text-red-500 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center text-slate-400">
            ยังไม่มีประกาศ กด &quot;ส่งประกาศ&quot; เพื่อสร้างข้อความใหม่
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">สร้างประกาศใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABEL).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อ *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น แจ้งตัดน้ำประปาชั่วคราว"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ข้อความ *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                  placeholder="รายละเอียดประกาศ..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ส่งถึง</label>
                <div className="flex gap-2 mb-2">
                  {[['all', 'ทุกห้อง'], ['specific', 'เลือกห้อง']].map(([v, l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, target_type: v, target_rooms: [] }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.target_type === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.target_type === 'specific' && (
                  <div className="grid grid-cols-4 gap-2">
                    {rooms.map(r => (
                      <button key={r.id} onClick={() => toggleRoom(r.id)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.target_rooms.includes(r.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                        {r.room_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={send} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Send size={15} /> ส่งประกาศ
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
