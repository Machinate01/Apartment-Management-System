'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const press = (digit: string) => {
    if (pin.length >= 6) return;
    setPin((p) => p + digit);
    setError('');
  };

  const del = () => setPin((p) => p.slice(0, -1));

  const submit = async (currentPin: string) => {
    if (currentPin.length < 4) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin }),
      });
      if (res.ok) {
        const from = searchParams.get('from') || '/';
        router.replace(from);
      } else {
        const data = await res.json();
        setError(data.error || 'PIN ไม่ถูกต้อง');
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDigit = (d: string) => {
    const next = pin.length < 6 ? pin + d : pin;
    if (next !== pin) {
      setPin(next);
      setError('');
      // Auto-submit when PIN reaches 4–6 chars (configurable via env)
      if (next.length >= 4) {
        // Small delay so user sees the last dot fill
        setTimeout(() => submit(next), 100);
      }
    }
  };

  const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">ระบบห้องเช่า</h1>
        <p className="text-sm text-slate-500 mt-1">กรอก PIN เพื่อเข้าสู่ระบบ</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              pin.length > i
                ? 'bg-blue-600 border-blue-600 scale-110'
                : 'bg-transparent border-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mb-4 font-medium animate-pulse">{error}</p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {DIGITS.map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === '⌫') {
            return (
              <button
                key={i}
                onPointerDown={(e) => { e.preventDefault(); del(); }}
                className="h-16 rounded-2xl bg-white border border-slate-200 text-slate-600 text-2xl font-light
                           flex items-center justify-center shadow-sm active:bg-slate-100 active:scale-95 transition-transform select-none"
              >
                {d}
              </button>
            );
          }
          return (
            <button
              key={i}
              onPointerDown={(e) => { e.preventDefault(); handleDigit(d); }}
              disabled={loading}
              className="h-16 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-semibold
                         flex items-center justify-center shadow-sm active:bg-blue-50 active:scale-95 transition-transform select-none
                         disabled:opacity-50"
            >
              {d}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">กำลังตรวจสอบ...</p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
