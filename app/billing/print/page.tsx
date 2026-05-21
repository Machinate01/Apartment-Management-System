'use client';

import { useEffect, useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Bill {
  id: number; room_id: number; room_number: string; tenant_name?: string;
  month: number; year: number; rent: number; water: number; electricity: number;
  other: number; other_desc: string; total: number; status: string;
}
interface Meter {
  room_id: number; water_prev: number; water_curr: number;
  electricity_prev: number; electricity_curr: number;
  water_rate: number; electricity_rate: number;
}
interface AppSettings { apt_name: string; electricity_rate: string; water_rate: string; }

const MONTHS_TH = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const fmt = (n: number) => parseFloat(n.toFixed(2));

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
    ]).then(([b, m, s]) => { setBills(b); setMeters(m); setSettings(s); setLoaded(true); });
  }, [month, year]);

  const getMeter = (roomId: number) => meters.find(m => m.room_id === roomId);

  // Group bills into pages of 2
  const pages: Bill[][] = [];
  for (let i = 0; i < bills.length; i += 2) pages.push(bills.slice(i, i + 2));

  return (
    <>
      {/* Controls */}
      <div id="print-controls" className="p-3 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
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
        <span className="text-sm text-slate-400">{bills.length} ใบ · {pages.length} แผ่น A4</span>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Printer size={16} /> พิมพ์ทั้งหมด
        </button>
      </div>

      {/* Print area */}
      <div id="print-area" className="bg-slate-200 p-6">
        {!loaded ? (
          <div className="text-center py-16 text-slate-400">กำลังโหลด...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            ไม่มีบิลสำหรับ {MONTHS_TH[month]} {year}<br />
            <Link href="/billing" className="text-blue-600 underline text-sm mt-2 inline-block">ไปสร้างบิล</Link>
          </div>
        ) : pages.map((pageBills, pageIdx) => (
          <div key={pageIdx} className="a4-page">
            {pageBills.map((bill, rowIdx) => {
              const meter = getMeter(bill.room_id);
              const elecUsage = meter ? fmt(meter.electricity_curr - meter.electricity_prev) : 0;
              const waterUsage = meter ? fmt(meter.water_curr - meter.water_prev) : 0;
              const thYear = year + 543;
              const aptName = settings.apt_name || 'อพาร์ตเมนต์';
              return (
                <div key={bill.id}>
                  {rowIdx > 0 && <div className="row-sep" />}
                  <div className="bill-row">
                    <SingleBill bill={bill} meter={meter} month={month} year={thYear} aptName={aptName} elecUsage={elecUsage} waterUsage={waterUsage} copy={false} />
                    <div className="col-sep" />
                    <SingleBill bill={bill} meter={meter} month={month} year={thYear} aptName={aptName} elecUsage={elecUsage} waterUsage={waterUsage} copy={true} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        /* ── Screen A4 preview ── */
        #print-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          height: 297mm;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          box-sizing: border-box;
          padding: 8mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .bill-row {
          flex: 1;
          display: flex;
          min-height: 0;
          gap: 0;
        }
        .col-sep {
          width: 1px;
          background: #cbd5e1;
          border-left: 1px dashed #94a3b8;
          flex-shrink: 0;
          margin: 0 3mm;
        }
        .row-sep {
          height: 1px;
          background: #cbd5e1;
          border-bottom: 1px dashed #94a3b8;
          flex-shrink: 0;
          margin: 3mm 0;
        }

        /* ── PRINT ── */
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          #print-controls { display: none !important; }
          #print-area {
            display: block !important;
            padding: 0 !important;
            background: white !important;
            gap: 0 !important;
          }
          .a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            padding: 8mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .bill-row {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            overflow: hidden !important;
          }
          .row-sep {
            margin: 2mm 0 !important;
            flex-shrink: 0 !important;
          }
          .col-sep {
            margin: 0 2mm !important;
          }
        }
      `}</style>
    </>
  );
}

function SingleBill({ bill, meter, month, year, aptName, elecUsage, waterUsage, copy }: {
  bill: Bill; meter: Meter | undefined; month: number; year: number; aptName: string;
  elecUsage: number; waterUsage: number; copy: boolean;
}) {
  return (
    <div style={{ flex: 1, fontFamily: 'Arial, sans-serif', fontSize: '11px', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#1e293b' }}>{aptName}</p>
          <p style={{ color: '#64748b', fontSize: '10px', margin: '1px 0 0' }}>ใบแจ้งค่าเช่าและค่าบริการ</p>
        </div>
        <span style={{
          fontSize: '9px', padding: '2px 7px', borderRadius: '4px', fontWeight: 600,
          background: copy ? '#f1f5f9' : '#dbeafe', color: copy ? '#64748b' : '#1d4ed8',
        }}>
          {copy ? 'สำเนา (เจ้าของ)' : 'ต้นฉบับ (ผู้เช่า)'}
        </span>
      </div>

      {/* Info */}
      <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '4px 0', marginBottom: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px', fontSize: '10px' }}>
        <div><span style={{ color: '#94a3b8' }}>ประจำเดือน: </span><span style={{ fontWeight: 600 }}>{MONTHS_TH[month]} {year}</span></div>
        <div><span style={{ color: '#94a3b8' }}>ห้องที่: </span><span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>{bill.room_number}</span></div>
        <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8' }}>ชื่อผู้เช่า: </span><span style={{ fontWeight: 600 }}>{bill.tenant_name || '—'}</span></div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: '3px 6px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0' }}>รายการ</th>
            <th style={{ textAlign: 'right', padding: '3px 6px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>หน่วย</th>
            <th style={{ textAlign: 'right', padding: '3px 6px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>จำนวนเงิน (฿)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '4px 6px' }}>ค่าเช่าห้อง</td>
            <td style={{ textAlign: 'right', padding: '4px 6px', color: '#94a3b8' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>{bill.rent.toLocaleString()}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '4px 6px' }}>
              ค่าไฟฟ้า
              {meter && <span style={{ color: '#94a3b8', marginLeft: 4 }}>({meter.electricity_prev}→{meter.electricity_curr})</span>}
            </td>
            <td style={{ textAlign: 'right', padding: '4px 6px', color: '#64748b' }}>{elecUsage > 0 ? elecUsage : '—'}</td>
            <td style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>{bill.electricity.toLocaleString()}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '4px 6px' }}>
              ค่าน้ำประปา
              {meter && <span style={{ color: '#94a3b8', marginLeft: 4 }}>({meter.water_prev}→{meter.water_curr})</span>}
            </td>
            <td style={{ textAlign: 'right', padding: '4px 6px', color: '#64748b' }}>{waterUsage > 0 ? waterUsage : '—'}</td>
            <td style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>{bill.water.toLocaleString()}</td>
          </tr>
          {bill.other > 0 && (
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '4px 6px' }}>{bill.other_desc || 'ค่าอื่นๆ'}</td>
              <td style={{ textAlign: 'right', padding: '4px 6px' }}>—</td>
              <td style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>{bill.other.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={2} style={{ padding: '5px 6px', fontWeight: 700 }}>ยอดชำระทั้งหมด</td>
            <td style={{ textAlign: 'right', padding: '5px 6px', fontWeight: 800, fontSize: '14px', color: '#1d4ed8' }}>{bill.total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
        {['ลายเซ็นผู้เช่า', 'ลายเซ็นเจ้าของ'].map(label => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '22px', marginBottom: '3px' }} />
            <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', margin: '4px 0 0' }}>
        {bill.status === 'paid'
          ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ ชำระแล้ว</span>
          : 'กรุณาชำระภายในวันที่กำหนด'}
      </p>
    </div>
  );
}
