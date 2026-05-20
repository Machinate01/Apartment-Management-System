'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  rooms: number;
  tenants: number;
  meters: number;
  month: number;
  year: number;
  errors: string[];
  error?: string;
}

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      alert('รองรับเฉพาะไฟล์ .xlsx หรือ .xls เท่านั้น');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const doImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, rooms: 0, tenants: 0, meters: 0, month: 0, year: 0, errors: [], error: 'เกิดข้อผิดพลาด' });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Upload size={22} /> นำเข้าจาก Excel</h2>
        <p className="text-slate-500 text-sm mt-1">อ่าน sheet &quot;บันทึกมิเตอร์&quot; จากไฟล์ .xlsx แล้วนำเข้าห้อง, ผู้เช่า และมิเตอร์</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">รองรับโครงสร้างไฟล์:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Sheet ชื่อ &quot;บันทึกมิเตอร์&quot;</li>
          <li>คอลัมน์: ห้องที่, ชื่อผู้เช่า, ไฟเก่า, ไฟใหม่, ..., น้ำเก่า, น้ำใหม่</li>
          <li>ดึงอัตราค่าไฟ/น้ำ/เช่า จากหน้า ตั้งค่า ของแอป</li>
        </ul>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <FileSpreadsheet size={40} className={dragging ? 'text-blue-500' : 'text-slate-300'} />
        <p className="mt-3 font-medium text-slate-600">{file ? file.name : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก'}</p>
        <p className="text-xs text-slate-400 mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : '.xlsx, .xls'}</p>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>

      {file && !result && (
        <button onClick={doImport} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? '⏳ กำลังนำเข้า...' : <><Upload size={16} /> นำเข้าข้อมูล</>}
        </button>
      )}

      {result && (
        <div className={`rounded-xl p-5 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle size={18} /> นำเข้าสำเร็จ — {MONTHS_TH[result.month]} {result.year + 543}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="ห้อง" value={result.rooms} color="blue" />
                <Stat label="ผู้เช่า" value={result.tenants} color="green" />
                <Stat label="มิเตอร์" value={result.meters} color="orange" />
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-amber-600 space-y-0.5">
                  {result.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <a href="/rooms" className="text-sm text-blue-600 underline">ดูผังห้อง →</a>
                <a href="/meter" className="text-sm text-blue-600 underline">ดูมิเตอร์ →</a>
                <a href="/billing" className="text-sm text-blue-600 underline">ทำบิล →</a>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{result.error || 'นำเข้าไม่สำเร็จ'}</p>
            </div>
          )}
        </div>
      )}

      {result?.success && (
        <button onClick={() => { setFile(null); setResult(null); }} className="text-sm text-slate-400 hover:text-slate-600 underline">
          นำเข้าไฟล์อื่น
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', orange: 'bg-orange-100 text-orange-700' };
  return (
    <div className={`rounded-lg p-3 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  );
}
