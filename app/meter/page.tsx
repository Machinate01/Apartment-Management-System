'use client';

import { useEffect, useState } from 'react';
import { Gauge, Save, History } from 'lucide-react';

interface Room { id: number; room_number: string; rent_price: number; status: string; }
interface Meter {
  id: number; room_id: number; room_number: string;
  month: number; year: number;
  water_prev: number; water_curr: number;
  electricity_prev: number; electricity_curr: number;
  water_rate: number; electricity_rate: number;
  recorded_at: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function MeterPage() {
  const now = new Date();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState({
    room_id: '', water_prev: '', water_curr: '', electricity_prev: '', electricity_curr: '',
    water_rate: '18', electricity_rate: '8',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/rooms').then(r => r.json()).then(setRooms);
  }, []);

  useEffect(() => {
    fetch(`/api/meters?month=${month}&year=${year}`).then(r => r.json()).then(setMeters);
  }, [month, year]);

  const waterUsage = Number(form.water_curr) - Number(form.water_prev);
  const elecUsage = Number(form.electricity_curr) - Number(form.electricity_prev);
  const waterCost = waterUsage * Number(form.water_rate);
  const elecCost = elecUsage * Number(form.electricity_rate);
  const totalUtil = waterCost + elecCost;

  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const totalBill = (selectedRoom?.rent_price || 0) + totalUtil;

  const handleSave = async () => {
    if (!form.room_id) return;
    await fetch('/api/meters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: Number(form.room_id), month, year,
        water_prev: Number(form.water_prev), water_curr: Number(form.water_curr),
        electricity_prev: Number(form.electricity_prev), electricity_curr: Number(form.electricity_curr),
        water_rate: Number(form.water_rate), electricity_rate: Number(form.electricity_rate),
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetch(`/api/meters?month=${month}&year=${year}`).then(r => r.json()).then(setMeters);
  };

  const loadPrevMeter = (roomId: number) => {
    const prev = meters.find(m => m.room_id === roomId);
    if (prev) {
      setForm(f => ({ ...f, water_prev: String(prev.water_curr), electricity_prev: String(prev.electricity_curr) }));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Gauge size={22} /> จดมิเตอร์</h2>
        <p className="text-slate-500 text-sm mt-1">บันทึกเลขมิเตอร์น้ำและไฟฟ้า</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-700">บันทึกมิเตอร์</h3>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">เดือน</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{MONTHS_TH[m]}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">ปี</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
                {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">เลือกห้อง *</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.room_id}
              onChange={e => { setForm(f => ({ ...f, room_id: e.target.value })); if (e.target.value) loadPrevMeter(Number(e.target.value)); }}>
              <option value="">-- เลือกห้อง --</option>
              {rooms.filter(r => r.status === 'occupied').map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="col-span-2 text-xs font-medium text-blue-600 uppercase tracking-wide">มิเตอร์น้ำ (หน่วย)</div>
            <MeterField label="เลขเดิม" value={form.water_prev} onChange={v => setForm(f => ({ ...f, water_prev: v }))} />
            <MeterField label="เลขใหม่" value={form.water_curr} onChange={v => setForm(f => ({ ...f, water_curr: v }))} />
            <div className="col-span-2 text-xs font-medium text-orange-500 uppercase tracking-wide">มิเตอร์ไฟ (หน่วย)</div>
            <MeterField label="เลขเดิม" value={form.electricity_prev} onChange={v => setForm(f => ({ ...f, electricity_prev: v }))} />
            <MeterField label="เลขใหม่" value={form.electricity_curr} onChange={v => setForm(f => ({ ...f, electricity_curr: v }))} />
            <MeterField label="ราคาน้ำ/หน่วย (฿)" value={form.water_rate} onChange={v => setForm(f => ({ ...f, water_rate: v }))} />
            <MeterField label="ราคาไฟ/หน่วย (฿)" value={form.electricity_rate} onChange={v => setForm(f => ({ ...f, electricity_rate: v }))} />
          </div>

          <button onClick={handleSave} disabled={!form.room_id}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Save size={16} /> {saved ? 'บันทึกแล้ว ✓' : 'บันทึกข้อมูล'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3">สรุปค่าใช้จ่าย</h3>
          {form.room_id ? (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">ค่าน้ำ ({waterUsage} หน่วย × ฿{form.water_rate})</span>
                  <span className="font-medium text-blue-700">฿{waterCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">ค่าไฟ ({elecUsage} หน่วย × ฿{form.electricity_rate})</span>
                  <span className="font-medium text-orange-600">฿{elecCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-100 pt-1.5 flex justify-between text-sm">
                  <span className="text-slate-600">ค่าเช่า</span>
                  <span className="font-medium">฿{(selectedRoom?.rent_price || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-200 pt-1.5 flex justify-between font-bold">
                  <span>รวมทั้งสิ้น</span>
                  <span className="text-blue-700 text-lg">฿{totalBill.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-8">เลือกห้องเพื่อดูการคำนวณ</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          <History size={16} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700">ประวัติมิเตอร์ {MONTHS_TH[month]} {year}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['ห้อง', 'น้ำ (เดิม→ใหม่)', 'หน่วยน้ำ', 'ไฟ (เดิม→ใหม่)', 'หน่วยไฟ', 'ค่าน้ำ', 'ค่าไฟ', 'รวม'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meters.map(m => {
              const wu = m.water_curr - m.water_prev;
              const eu = m.electricity_curr - m.electricity_prev;
              return (
                <tr key={m.id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium">{m.room_number}</td>
                  <td className="px-3 py-2.5 text-slate-500">{m.water_prev}→{m.water_curr}</td>
                  <td className="px-3 py-2.5">{wu}</td>
                  <td className="px-3 py-2.5 text-slate-500">{m.electricity_prev}→{m.electricity_curr}</td>
                  <td className="px-3 py-2.5">{eu}</td>
                  <td className="px-3 py-2.5 text-blue-600">฿{(wu * m.water_rate).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-orange-600">฿{(eu * m.electricity_rate).toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-semibold">฿{(wu * m.water_rate + eu * m.electricity_rate).toLocaleString()}</td>
                </tr>
              );
            })}
            {meters.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-slate-400">ยังไม่มีข้อมูลมิเตอร์</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MeterField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} min="0"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
