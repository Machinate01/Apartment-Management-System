'use client';

import { useEffect, useState } from 'react';
import { Gauge, Save, History, ChevronDown } from 'lucide-react';

interface Room { id: number; room_number: string; rent_price: number; status: string; }
interface Meter {
  id: number; room_id: number; room_number: string;
  month: number; year: number;
  water_prev: number; water_curr: number;
  electricity_prev: number; electricity_curr: number;
  water_rate: number; electricity_rate: number;
  recorded_at: string;
}

const MONTHS_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_FULL = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

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
  const [saving, setSaving] = useState(false);

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
  const hasValues = waterUsage > 0 || elecUsage > 0;

  const handleSave = async () => {
    if (!form.room_id) return;
    setSaving(true);
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
    setSaving(false);
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
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto md:max-w-none">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Gauge size={20} /> จดมิเตอร์
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">บันทึกเลขมิเตอร์น้ำและไฟฟ้า</p>
      </div>

      {/* Month/Year selector — compact row on mobile */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <select
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m =>
              <option key={m} value={m}>{MONTHS_FULL[m]}</option>
            )}
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="w-28 relative">
          <select
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          {/* Room selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">เลือกห้อง</label>
            <select
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              value={form.room_id}
              onChange={e => {
                setForm(f => ({ ...f, room_id: e.target.value }));
                if (e.target.value) loadPrevMeter(Number(e.target.value));
              }}>
              <option value="">-- เลือกห้อง --</option>
              {rooms.filter(r => r.status === 'occupied').map(r =>
                <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>
              )}
            </select>
            <ChevronDown size={18} className="absolute right-3 bottom-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Water meter */}
          <div className="bg-blue-50 rounded-xl p-3.5 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
              💧 มิเตอร์น้ำ (หน่วย)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MeterField label="เลขเดิม" value={form.water_prev} onChange={v => setForm(f => ({ ...f, water_prev: v }))} />
              <MeterField label="เลขใหม่" value={form.water_curr} onChange={v => setForm(f => ({ ...f, water_curr: v }))} highlight />
            </div>
            {waterUsage > 0 && (
              <p className="text-sm text-blue-700 font-medium">ใช้ไป {waterUsage} หน่วย = ฿{waterCost.toLocaleString()}</p>
            )}
          </div>

          {/* Electricity meter */}
          <div className="bg-orange-50 rounded-xl p-3.5 space-y-3">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1.5">
              ⚡ มิเตอร์ไฟ (หน่วย)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MeterField label="เลขเดิม" value={form.electricity_prev} onChange={v => setForm(f => ({ ...f, electricity_prev: v }))} />
              <MeterField label="เลขใหม่" value={form.electricity_curr} onChange={v => setForm(f => ({ ...f, electricity_curr: v }))} highlight />
            </div>
            {elecUsage > 0 && (
              <p className="text-sm text-orange-600 font-medium">ใช้ไป {elecUsage} หน่วย = ฿{elecCost.toLocaleString()}</p>
            )}
          </div>

          {/* Rates (collapsed-look, small) */}
          <div className="grid grid-cols-2 gap-3">
            <MeterField label="ราคาน้ำ/หน่วย (฿)" value={form.water_rate} onChange={v => setForm(f => ({ ...f, water_rate: v }))} small />
            <MeterField label="ราคาไฟ/หน่วย (฿)" value={form.electricity_rate} onChange={v => setForm(f => ({ ...f, electricity_rate: v }))} small />
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={!form.room_id || saving}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}>
            <Save size={18} />
            {saved ? '✓ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกมิเตอร์'}
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">สรุปค่าใช้จ่าย</h3>
          {form.room_id && hasValues ? (
            <div className="space-y-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">💧 ค่าน้ำ ({waterUsage} หน่วย)</span>
                  <span className="font-semibold text-blue-700">฿{waterCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">⚡ ค่าไฟ ({elecUsage} หน่วย)</span>
                  <span className="font-semibold text-orange-600">฿{elecCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-500">🏠 ค่าเช่า</span>
                  <span className="font-semibold">฿{(selectedRoom?.rent_price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2.5">
                  <span className="font-bold text-slate-800">รวมทั้งสิ้น</span>
                  <span className="font-bold text-blue-700 text-xl">฿{totalBill.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-10">
              <Gauge size={32} className="mx-auto mb-2 opacity-30" />
              เลือกห้องและกรอกตัวเลข
            </div>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <History size={16} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700">ประวัติ {MONTHS_FULL[month]} {year}</h3>
          <span className="ml-auto text-xs text-slate-400">{meters.length} ห้อง</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-slate-50">
              <tr>
                {['ห้อง', 'น้ำ (เดิม→ใหม่)', 'หน่วย', 'ไฟ (เดิม→ใหม่)', 'หน่วย', 'ค่าน้ำ', 'ค่าไฟ', 'รวม'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meters.map(m => {
                const wu = m.water_curr - m.water_prev;
                const eu = m.electricity_curr - m.electricity_prev;
                return (
                  <tr key={m.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{m.room_number}</td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{m.water_prev}→{m.water_curr}</td>
                    <td className="px-3 py-2.5 font-medium">{wu}</td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{m.electricity_prev}→{m.electricity_curr}</td>
                    <td className="px-3 py-2.5 font-medium">{eu}</td>
                    <td className="px-3 py-2.5 text-blue-600 font-medium whitespace-nowrap">฿{(wu * m.water_rate).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-orange-600 font-medium whitespace-nowrap">฿{(eu * m.electricity_rate).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">฿{(wu * m.water_rate + eu * m.electricity_rate).toLocaleString()}</td>
                  </tr>
                );
              })}
              {meters.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">ยังไม่มีข้อมูลมิเตอร์เดือนนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MeterField({
  label, value, onChange, highlight, small
}: {
  label: string; value: string; onChange: (v: string) => void; highlight?: boolean; small?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1 font-medium">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={e => onChange(e.target.value)}
        min="0"
        className={`w-full border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          small ? 'py-2 text-sm border-slate-200 bg-white' : 'py-3 text-base border-slate-200 bg-white'
        } ${highlight ? 'border-blue-300 bg-blue-50 font-semibold' : ''}`}
      />
    </div>
  );
}
