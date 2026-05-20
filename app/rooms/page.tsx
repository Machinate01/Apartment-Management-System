'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Edit2, User } from 'lucide-react';

interface Room {
  id: number;
  room_number: string;
  building: number;
  floor: number;
  type: string;
  rent_price: number;
  status: string;
  tenant_name?: string;
  tenant_phone?: string;
}

interface Tenant {
  id: number;
  name: string;
  phone: string;
  email: string;
  id_card: string;
  room_id: number | null;
  start_date: string;
  end_date: string;
  deposit: number;
  status: string;
  room_number?: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  occupied: { label: 'มีผู้เช่า', color: 'bg-green-500' },
  vacant: { label: 'ว่าง', color: 'bg-blue-400' },
  maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-500' },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'tenants'>('rooms');

  const [roomForm, setRoomForm] = useState({ room_number: '', building: 1, floor: 1, type: 'standard', rent_price: 3000 });
  const [tenantForm, setTenantForm] = useState({ name: '', phone: '', email: '', id_card: '', room_id: '', start_date: '', end_date: '', deposit: 0 });

  const load = () => {
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
    fetch('/api/tenants').then(r => r.json()).then(setTenants);
  };

  useEffect(() => { load(); }, []);

  const saveRoom = async () => {
    const method = editRoom ? 'PUT' : 'POST';
    const body = editRoom ? { ...roomForm, id: editRoom.id, status: editRoom.status } : roomForm;
    await fetch('/api/rooms', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowRoomModal(false); setEditRoom(null);
    setRoomForm({ room_number: '', building: 1, floor: 1, type: 'standard', rent_price: 3000 });
    load();
  };

  const saveTenant = async () => {
    const method = editTenant ? 'PUT' : 'POST';
    const body = editTenant
      ? { ...tenantForm, id: editTenant.id, room_id: tenantForm.room_id ? Number(tenantForm.room_id) : null, status: 'active' }
      : { ...tenantForm, room_id: tenantForm.room_id ? Number(tenantForm.room_id) : null };
    await fetch('/api/tenants', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowTenantModal(false); setEditTenant(null);
    setTenantForm({ name: '', phone: '', email: '', id_card: '', room_id: '', start_date: '', end_date: '', deposit: 0 });
    load();
  };

  const openEditRoom = (r: Room) => {
    setEditRoom(r);
    setRoomForm({ room_number: r.room_number, building: r.building, floor: r.floor, type: r.type, rent_price: r.rent_price });
    setShowRoomModal(true);
  };

  const openEditTenant = (t: Tenant) => {
    setEditTenant(t);
    setTenantForm({ name: t.name, phone: t.phone || '', email: t.email || '', id_card: t.id_card || '', room_id: t.room_id ? String(t.room_id) : '', start_date: t.start_date || '', end_date: t.end_date || '', deposit: t.deposit });
    setShowTenantModal(true);
  };

  const vacantRooms = rooms.filter(r => r.status === 'vacant');

  // Group rooms by building → floor
  const grouped = rooms.reduce<Record<number, Record<number, Room[]>>>((acc, r) => {
    const b = r.building || 1;
    const f = r.floor || 1;
    if (!acc[b]) acc[b] = {};
    if (!acc[b][f]) acc[b][f] = [];
    acc[b][f].push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ผังห้อง</h2>
          <p className="text-slate-500 text-sm mt-1">จัดการห้องและผู้เช่า</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowTenantModal(true); setEditTenant(null); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <User size={16} /> เพิ่มผู้เช่า
          </button>
          <button onClick={() => { setShowRoomModal(true); setEditRoom(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> เพิ่มห้อง
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['rooms', 'tenants'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {tab === 'rooms' ? `ผังห้อง (${rooms.length})` : `ผู้เช่า (${tenants.filter(t => t.status === 'active').length})`}
          </button>
        ))}
      </div>

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {rooms.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              ยังไม่มีห้อง กดปุ่ม &quot;เพิ่มห้อง&quot; เพื่อเริ่มต้น
            </div>
          )}
          {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(bKey => {
            const bNum = Number(bKey);
            const floors = grouped[bNum];
            return (
              <div key={bNum} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800 text-white font-semibold text-sm">
                  ตึก {bNum}
                  <span className="ml-2 text-slate-400 font-normal text-xs">
                    {Object.values(floors).flat().length} ห้อง
                    · ว่าง {Object.values(floors).flat().filter(r => r.status === 'vacant').length}
                    · มีผู้เช่า {Object.values(floors).flat().filter(r => r.status === 'occupied').length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {Object.keys(floors).sort((a, b) => Number(a) - Number(b)).map(fKey => {
                    const fNum = Number(fKey);
                    const roomsInFloor = floors[fNum];
                    return (
                      <div key={fNum} className="p-4">
                        <p className="text-xs font-medium text-slate-400 mb-3">ชั้น {fNum}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
                          {roomsInFloor.map(room => {
                            const s = STATUS_LABEL[room.status] || STATUS_LABEL.vacant;
                            return (
                              <div key={room.id}
                                className="rounded-lg p-2.5 border border-slate-100 cursor-pointer hover:shadow-md transition-shadow bg-white"
                                onClick={() => openEditRoom(room)}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-slate-700 text-sm">{room.room_number}</span>
                                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                                </div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                                {room.tenant_name && <p className="text-xs text-blue-600 mt-0.5 truncate">{room.tenant_name}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['ชื่อ', 'ห้อง', 'โทรศัพท์', 'เริ่มเช่า', 'สิ้นสุด', 'มัดจำ', 'สถานะ', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.filter(t => t.status === 'active').map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.room_number || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{t.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{t.start_date || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{t.end_date || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">฿{t.deposit.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">กำลังเช่า</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditTenant(t)} className="text-slate-400 hover:text-blue-600"><Edit2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {tenants.filter(t => t.status === 'active').length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">ยังไม่มีผู้เช่า</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRoomModal && (
        <Modal title={editRoom ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'} onClose={() => { setShowRoomModal(false); setEditRoom(null); }}>
          <div className="space-y-3">
            <Field label="เลขห้อง *" type="text" value={roomForm.room_number} onChange={v => setRoomForm(p => ({ ...p, room_number: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ตึก</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={roomForm.building} onChange={e => setRoomForm(p => ({ ...p, building: Number(e.target.value) }))}>
                  <option value={1}>ตึก 1</option>
                  <option value={2}>ตึก 2</option>
                  <option value={3}>ตึก 3</option>
                </select>
              </div>
              <Field label="ชั้น" type="number" value={String(roomForm.floor)} onChange={v => setRoomForm(p => ({ ...p, floor: Number(v) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทห้อง</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={roomForm.type} onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))}>
                <option value="standard">ห้องธรรมดา</option>
                <option value="deluxe">ห้องดีลักซ์</option>
                <option value="suite">ห้องสวีท</option>
              </select>
            </div>
            <Field label="ค่าเช่า (บาท/เดือน)" type="number" value={String(roomForm.rent_price)} onChange={v => setRoomForm(p => ({ ...p, rent_price: Number(v) }))} />
            {editRoom && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={editRoom.status} onChange={e => setEditRoom(p => p ? { ...p, status: e.target.value } : p)}>
                  <option value="vacant">ว่าง</option>
                  <option value="occupied">มีผู้เช่า</option>
                  <option value="maintenance">ซ่อมบำรุง</option>
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={saveRoom} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">บันทึก</button>
              <button onClick={() => { setShowRoomModal(false); setEditRoom(null); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">ยกเลิก</button>
            </div>
          </div>
        </Modal>
      )}

      {showTenantModal && (
        <Modal title={editTenant ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่'} onClose={() => { setShowTenantModal(false); setEditTenant(null); }}>
          <div className="space-y-3">
            <Field label="ชื่อ-นามสกุล *" type="text" value={tenantForm.name} onChange={v => setTenantForm(p => ({ ...p, name: v }))} />
            <Field label="โทรศัพท์" type="text" value={tenantForm.phone} onChange={v => setTenantForm(p => ({ ...p, phone: v }))} />
            <Field label="อีเมล" type="email" value={tenantForm.email} onChange={v => setTenantForm(p => ({ ...p, email: v }))} />
            <Field label="เลขบัตรประชาชน" type="text" value={tenantForm.id_card} onChange={v => setTenantForm(p => ({ ...p, id_card: v }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ห้อง</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={tenantForm.room_id} onChange={e => setTenantForm(p => ({ ...p, room_id: e.target.value }))}>
                <option value="">-- เลือกห้อง --</option>
                {vacantRooms.map(r => <option key={r.id} value={r.id}>{r.room_number} (฿{r.rent_price.toLocaleString()})</option>)}
              </select>
            </div>
            <Field label="วันเริ่มเช่า" type="date" value={tenantForm.start_date} onChange={v => setTenantForm(p => ({ ...p, start_date: v }))} />
            <Field label="วันสิ้นสุดสัญญา" type="date" value={tenantForm.end_date} onChange={v => setTenantForm(p => ({ ...p, end_date: v }))} />
            <Field label="เงินมัดจำ (บาท)" type="number" value={String(tenantForm.deposit)} onChange={v => setTenantForm(p => ({ ...p, deposit: Number(v) }))} />
            <div className="flex gap-2 pt-2">
              <button onClick={saveTenant} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">บันทึก</button>
              <button onClick={() => { setShowTenantModal(false); setEditTenant(null); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">ยกเลิก</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
