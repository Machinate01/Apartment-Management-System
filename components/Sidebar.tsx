'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Gauge, Receipt,
  FileText, Grid3X3, FileSignature,
  Settings, Upload, LogOut, MoreHorizontal, X
} from 'lucide-react';

// ─── Desktop sidebar items ────────────────────────────────────────────────────
const mainItems = [
  { href: '/',          label: 'แดชบอร์ด',    icon: LayoutDashboard },
  { href: '/rooms',     label: 'ผังห้อง',      icon: Grid3X3 },
  { href: '/meter',     label: 'จดมิเตอร์',    icon: Gauge },
  { href: '/billing',   label: 'ทำบิล',        icon: Receipt },
  { href: '/reports',   label: 'รายงานสรุป',   icon: FileText },
  { href: '/contracts', label: 'สัญญาเช่า',    icon: FileSignature },
];
const utilItems = [
  { href: '/import',   label: 'นำเข้า Excel', icon: Upload },
  { href: '/settings', label: 'ตั้งค่า',       icon: Settings },
];

// ─── Mobile bottom nav (5 visible + drawer) ──────────────────────────────────
const bottomNav = [
  { href: '/',        label: 'หน้าหลัก', icon: LayoutDashboard },
  { href: '/rooms',   label: 'ห้อง',     icon: Grid3X3 },
  { href: '/meter',   label: 'มิเตอร์',  icon: Gauge },
  { href: '/billing', label: 'บิล',      icon: Receipt },
];
const drawerItems = [
  { href: '/reports',   label: 'รายงาน',      icon: FileText },
  { href: '/contracts', label: 'สัญญา',       icon: FileSignature },
  { href: '/import',    label: 'นำเข้า Excel', icon: Upload },
  { href: '/settings',  label: 'ตั้งค่า',      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === '/login') return null;

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // ── Desktop sidebar ──────────────────────────────────────────────────────────
  return (
    <>
      <aside className="hidden md:flex w-60 min-h-screen bg-slate-900 flex-col print:hidden shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg leading-tight">🏠 ระบบห้องเช่า</h1>
          <p className="text-slate-400 text-xs mt-1">Rental Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
              <Icon size={18} />{label}
            </Link>
          ))}
          <div className="border-t border-slate-700 my-2 pt-2 space-y-1">
            {utilItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-2">
          <button onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={16} />ออกจากระบบ
          </button>
          <p className="text-slate-600 text-xs text-center">v1.2.0</p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-700 z-40 print:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch h-16">
          {bottomNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            // จดมิเตอร์ = highlighted center action
            if (href === '/meter') {
              return (
                <Link key={href} href={href}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    active ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'
                  } -mt-5 shadow-lg shadow-blue-900/50`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className={`text-[10px] mt-1 ${active ? 'text-blue-400' : 'text-slate-400'}`}>{label}</span>
                </Link>
              );
            }
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 pt-1">
                <Icon size={21} className={active ? 'text-blue-400' : 'text-slate-500'} />
                <span className={`text-[10px] ${active ? 'text-blue-400' : 'text-slate-500'}`}>{label}</span>
              </Link>
            );
          })}

          {/* ปุ่ม "เพิ่มเติม" */}
          <button onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 pt-1">
            <MoreHorizontal size={21} className={drawerOpen ? 'text-blue-400' : 'text-slate-500'} />
            <span className={`text-[10px] ${drawerOpen ? 'text-blue-400' : 'text-slate-500'}`}>เพิ่มเติม</span>
          </button>
        </div>
      </nav>

      {/* ── Drawer (slide-up panel) ──────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 print:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />

          {/* panel */}
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 rounded-t-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <span className="text-white font-semibold">เมนูเพิ่มเติม</span>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-0 p-4">
              {drawerItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-colors ${
                    isActive(href) ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}>
                  <Icon size={22} />
                  <span className="text-xs text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>

            <div className="px-4 pb-2">
              <button onClick={() => { setDrawerOpen(false); logout(); }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700">
                <LogOut size={16} />ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
