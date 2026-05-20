'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle, Plus, Building2 } from 'lucide-react';

interface AppSettings {
  apt_name: string;
  electricity_rate: string;
  water_rate: string;
  default_rent: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings>({ apt_name: '', electricity_rate: '10', water_rate: '20', default_rent: '2000' });
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [seedCount, setSeedCount] = useState(40);
  const [seedFloors, setSeedFloors] = useState(4);
  const [prefix, setPrefix] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setForm);
  }, []);

  const save = async () => {
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const seedRooms = async () => {
    setSeeding(true);
    const roomsPerFloor = Math.ceil(seedCount / seedFloors);
    const rooms = [];
    for (let f = 1; f <= seedFloors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const num = (f - 1) * roomsPerFloor + r;
        if (num > seedCount) break;
        const roomNum = prefix + String(f) + String(r).padStart(2, '0');
        rooms.push({ room_number: roomNum, floor: f, type: 'standard', rent_price: Number(form.default_rent) });
      }
    }
    let created = 0;
    for (const room of rooms) {
      const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room) });
      if (res.ok) created++;
    }
    setSeeding(false);
    setSeedDone(true);
    setTimeout(() => setSeedDone(false), 3000);
    alert(`สร้างห้องสำเร็จ ${created} ห้อง`);
  };

  const seedSimple = async () => {
    setSeeding(true);
    let created = 0;
    for (let i = 1; i <= seedCount; i++) {
      const roomNum = String(i).padStart(2, '0');
      const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_number: roomNum, floor: 1, type: 'standard', rent_price: Number(form.default_rent) }) });
      if (res.ok) created++;
    }
    setSeeding(false);
    setSeedDone(true);
    setTimeout(() => setSeedDone(false), 3000);
    alert(`สร้างห้องสำเร็จ ${created} ห้อง (01–${String(seedCount).padStart(2, '0')})`);
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings size={22} /> ตั้งค่าระบบ</h2>
        <p className="text-slate-500 text-sm mt-1">อัตราค่าน้ำ ค่าไฟ และค่าเช่า default</p>
      </div>

      {/* อัตราค่าบริการ */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-700">ข้อมูลอพาร์ตเมนต์</h3>
        <SettingField label="ชื่ออพาร์ตเมนต์" value={form.apt_name} onChange={v => setForm(f => ({ ...f, apt_name: v }))} placeholder="เช่น อพาร์ตเมนต์สุขสบาย" />

        <h3 className="font-semibold text-slate-700 pt-2">อัตราค่าบริการ (ตั้งค่า)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">ค่าไฟ (บาท/หน่วย)</label>
            <input type="number" value={form.electricity_rate} onChange={e => setForm(f => ({ ...f, electricity_rate: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">ค่าน้ำ (บาท/หน่วย)</label>
            <input type="number" value={form.water_rate} onChange={e => setForm(f => ({ ...f, water_rate: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">ค่าเช่า default (บาท)</label>
            <input type="number" value={form.default_rent} onChange={e => setForm(f => ({ ...f, default_rent: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
          ตัวอย่าง: ใช้ไฟ 100 หน่วย = <strong>฿{(100 * Number(form.electricity_rate)).toLocaleString()}</strong> &nbsp;|&nbsp;
          ใช้น้ำ 10 หน่วย = <strong>฿{(10 * Number(form.water_rate)).toLocaleString()}</strong>
        </div>

        <button onClick={save} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {saved ? <><CheckCircle size={16} /> บันทึกแล้ว!</> : <><Save size={16} /> บันทึกการตั้งค่า</>}
        </button>
      </div>

      {/* สร้างห้อง */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Building2 size={16} /> สร้างห้องอัตโนมัติ</h3>

        <div className="border border-slate-100 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">แบบเลขต่อเนื่อง (01, 02, ...)</p>
          <p className="text-xs text-slate-400">เหมาะกับอพาร์ตเมนต์ที่ใช้ระบบ Excel เดิม (ห้อง 01–40)</p>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">จำนวนห้อง</label>
              <input type="number" value={seedCount} onChange={e => setSeedCount(Number(e.target.value))} min={1} max={200}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={seedSimple} disabled={seeding}
              className="mt-5 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <Plus size={15} />
              {seeding ? 'กำลังสร้าง...' : seedDone ? 'สร้างแล้ว ✓' : `สร้างห้อง 01–${String(seedCount).padStart(2,'0')}`}
            </button>
          </div>
        </div>

        <div className="border border-slate-100 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">แบบแยกชั้น (101, 102, 201, ...)</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Prefix (ถ้ามี)</label>
              <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="เช่น A"
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">จำนวนชั้น</label>
              <input type="number" value={seedFloors} onChange={e => setSeedFloors(Number(e.target.value))} min={1} max={20}
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">จำนวนห้องทั้งหมด</label>
              <input type="number" value={seedCount} onChange={e => setSeedCount(Number(e.target.value))} min={1} max={200}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={seedRooms} disabled={seeding}
              className="mt-5 flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
              <Plus size={15} />
              {seeding ? 'กำลังสร้าง...' : 'สร้างห้องแบบแยกชั้น'}
            </button>
          </div>
          <p className="text-xs text-slate-400">ตัวอย่าง: {prefix}101, {prefix}102, {prefix}201... ({seedFloors} ชั้น รวม {seedCount} ห้อง)</p>
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
