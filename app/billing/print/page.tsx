'use client';

import { useEffect, useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Bill {
  id: number;
  room_id: number;
  room_number: string;
  tenant_name?: string;
  month: number;
  year: number;
  rent: number;
  water: number;
  electricity: number;
  other: number;
  other_desc: string;
  total: number;
  status: string;
}

interface Meter {
  room_id: number;
  water_prev: number;
  water_curr: number;
  electricity_prev: number;
  electricity_curr: number;
  water_rate: number;
  electricity_rate: number;
}

interface AppSettings {
  apt_name: string;
  electricity_rate: string;
  water_rate: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function PrintBillPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [bills, setBills] = useState<Bill[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ apt_name: 'อพาร์ตเมนต์', electricity_rate: '10', water_rate: '20' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      fetch(`/api/bills?month=${month}&year=${year}`).then(r => r.json()),
      fetch(`/api/meters?month=${month}&year=${year}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([b, m, s]) => {
      setBills(b);
      setMeters(m);
      setSettings(s);
      setLoaded(true);
    });
  }, [month, year]);

  const getMeter = (roomId: number) => meters.find(m => m.room_id === roomId);

  return (
    <>
      {/* Controls — hidden on print */}
      <div className="print:hidden p-4 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/billing" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm">
          <ArrowLeft size={16} /> กลับ
        </Link>
        <div className="flex items-center gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{MONTHS_TH[m]}</option>)}
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span className="text-sm text-slate-400">{bills.length} ใบ</span>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Printer size={16} /> พิมพ์ทั้งหมด
        </button>
      </div>

      {/* Print area */}
      <div className="p-4 print:p-0">
        {!loaded ? (
          <div className="text-center py-16 text-slate-400">กำลังโหลด...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            ไม่มีบิลสำหรับ {MONTHS_TH[month]} {year}<br />
            <Link href="/billing" className="text-blue-600 underline text-sm mt-2 inline-block">ไปสร้างบิล</Link>
          </div>
        ) : (
          <div className="space-y-0">
            {bills.map((bill, idx) => {
              const meter = getMeter(bill.room_id);
              return (
                <BillPair
                  key={bill.id}
                  bill={bill}
                  meter={meter}
                  month={month}
                  year={year}
                  aptName={settings.apt_name || 'อพาร์ตเมนต์'}
                  pageBreak={idx < bills.length - 1}
                />
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>
    </>
  );
}

function BillPair({ bill, meter, month, year, aptName, pageBreak }: {
  bill: Bill; meter: Meter | undefined; month: number; year: number; aptName: string; pageBreak: boolean;
}) {
  const thYear = year + 543;
  const elecUsage = meter ? meter.electricity_curr - meter.electricity_prev : 0;
  const waterUsage = meter ? meter.water_curr - meter.water_prev : 0;

  return (
    <div className={`flex gap-4 py-4 ${pageBreak ? 'print:break-after-page' : ''}`}>
      <SingleBill bill={bill} meter={meter} month={month} year={thYear} aptName={aptName} elecUsage={elecUsage} waterUsage={waterUsage} copy={false} />
      <div className="w-px bg-dashed border-l border-dashed border-slate-300 print:border-slate-400" />
      <SingleBill bill={bill} meter={meter} month={month} year={thYear} aptName={aptName} elecUsage={elecUsage} waterUsage={waterUsage} copy={true} />
    </div>
  );
}

function SingleBill({ bill, meter, month, year, aptName, elecUsage, waterUsage, copy }: {
  bill: Bill; meter: Meter | undefined; month: number; year: number; aptName: string;
  elecUsage: number; waterUsage: number; copy: boolean;
}) {
  return (
    <div className="flex-1 border border-slate-300 rounded-lg p-4 text-sm" style={{ fontFamily: 'Arial, sans-serif', minWidth: 0 }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-base text-slate-800">{aptName}</p>
          <p className="text-slate-500 text-xs">ใบแจ้งค่าเช่าและค่าบริการ</p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${copy ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
            {copy ? 'สำเนา (เจ้าของ)' : 'ต้นฉบับ (ผู้เช่า)'}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div><span className="text-slate-400">ประจำเดือน:</span> <span className="font-medium">{MONTHS_TH[month]} {year}</span></div>
        <div><span className="text-slate-400">ห้องที่:</span> <span className="font-bold text-lg text-slate-800"> {bill.room_number}</span></div>
        <div className="col-span-2"><span className="text-slate-400">ชื่อผู้เช่า:</span> <span className="font-medium">{bill.tenant_name || '—'}</span></div>
      </div>

      {/* Items */}
      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left py-1.5 px-2 text-slate-500 font-medium">รายการ</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-medium">จำนวนหน่วย</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-medium">จำนวนเงิน (฿)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-1.5 px-2">ค่าเช่าห้อง</td>
            <td className="text-right py-1.5 px-2 text-slate-400">—</td>
            <td className="text-right py-1.5 px-2 font-medium">{bill.rent.toLocaleString()}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-1.5 px-2">
              ค่าไฟฟ้า
              {meter && <span className="text-slate-400 ml-1">({meter.electricity_prev}→{meter.electricity_curr})</span>}
            </td>
            <td className="text-right py-1.5 px-2 text-slate-500">{elecUsage > 0 ? elecUsage : '—'}</td>
            <td className="text-right py-1.5 px-2 font-medium">{bill.electricity.toLocaleString()}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-1.5 px-2">
              ค่าน้ำประปา
              {meter && <span className="text-slate-400 ml-1">({meter.water_prev}→{meter.water_curr})</span>}
            </td>
            <td className="text-right py-1.5 px-2 text-slate-500">{waterUsage > 0 ? waterUsage : '—'}</td>
            <td className="text-right py-1.5 px-2 font-medium">{bill.water.toLocaleString()}</td>
          </tr>
          {bill.other > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-1.5 px-2">{bill.other_desc || 'ค่าอื่นๆ'}</td>
              <td className="text-right py-1.5 px-2">—</td>
              <td className="text-right py-1.5 px-2 font-medium">{bill.other.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50">
            <td className="py-2 px-2 font-bold" colSpan={2}>ยอดชำระทั้งหมด</td>
            <td className="text-right py-2 px-2 font-bold text-blue-700 text-base">{bill.total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
        <div className="text-center">
          <div className="border-b border-slate-300 h-8 mb-1" />
          <p className="text-xs text-slate-400">ลายเซ็นผู้เช่า</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-300 h-8 mb-1" />
          <p className="text-xs text-slate-400">ลายเซ็นเจ้าของ</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-center">
        {bill.status === 'paid'
          ? <span className="text-green-600 font-medium">✓ ชำระแล้ว</span>
          : 'กรุณาชำระภายในวันที่กำหนด'}
      </p>
    </div>
  );
}
