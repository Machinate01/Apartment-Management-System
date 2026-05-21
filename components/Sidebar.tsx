'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Gauge, Receipt, BarChart2,
  FileText, Grid3X3, FileSignature, Package, MessageSquare,
  Settings, Upload, MoreHorizontal, X
} from 'lucide-react';

const primaryItems = [
  { href: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/rooms', label: 'ผังห้อง', icon: Grid3X3 },
  { href: '/meter', label: 'จดมิเตอร์', icon: Gauge },
  { href: '/billing', label: 'ทำบิล', icon: Receipt },
];

const secondaryItems = [
  { href: '/analytics', label: 'วิเคราะห์ข้อมูล', icon: BarChart2 },
  { href: '/reports', label: 'รายงานสรุป', icon: FileText },
  { href: '/contracts', label: 'สัญญาเช่า', icon: FileSignature },
  { href: '/parcels', label: 'พัสดุ', icon: Package },
  { href: '/communication', label: 'สื่อสาร', icon: MessageSquare },
  { href: '/import', label: 'นำเข้า Excel', icon: Upload },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

const allMainItems = [
  ...primaryItems,
  { href: '/analytics', label: 'วิเคราะห์ข้อมูล', icon: BarChart2 },
  { href: '/reports', label: 'รายงานสรุป', icon: FileText },
  { href: '/contracts', label: 'สัญญาเช่า', icon: FileSignature },
  { href: '/parcels', label: 'พัสดุ', icon: Package },
  { href: '/communication', label: 'สื่อสาร', icon: MessageSquare },
];

const utilItems = [
  { href: '/import', label: 'นำเข้า Excel', icon: Upload },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  // Desktop sidebar nav link
  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive(href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}>
      <Icon size={18} />
      {label}
    </Link>
  );

  return (
    <>
      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <aside className="hidden md:flex w-60 min-h-screen bg-slate-900 flex-col print:hidden">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg leading-tight">🏠 ระบบห้องเช่า</h1>
          <p className="text-slate-400 text-xs mt-1">Rental Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allMainItems.map(item => <NavLink key={item.href} {...item} />)}
          <div className="border-t border-slate-700 my-2 pt-2 space-y-1">
            {utilItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs text-center">v1.1.0</p>
        </div>
      </aside>

      {/* ─── Mobile Bottom Nav (hidden on desktop) ─── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-700 flex md:hidden print:hidden safe-area-pb">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const isMeter = href === '/meter';
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isMeter
                  ? active
                    ? 'text-blue-400'
                    : 'text-blue-300'
                  : active
                    ? 'text-blue-400'
                    : 'text-slate-400'
              }`}>
              {isMeter ? (
                <span className={`flex items-center justify-center rounded-full w-10 h-10 mb-0.5 transition-colors ${
                  active ? 'bg-blue-600' : 'bg-slate-700'
                }`}>
                  <Icon size={20} className="text-white" />
                </span>
              ) : (
                <Icon size={22} />
              )}
              <span className={`text-[10px] font-medium leading-none ${isMeter ? 'hidden' : ''}`}>{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-slate-400 active:text-white transition-colors">
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-medium leading-none">เพิ่มเติม</span>
        </button>
      </nav>

      {/* ─── Mobile Drawer Overlay ─── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 rounded-t-2xl md:hidden safe-area-pb">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-700">
              <span className="text-white font-semibold text-base">เมนูทั้งหมด</span>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 p-1 -mr-1">
                <X size={22} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-4 gap-3 pb-6">
              {secondaryItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                      active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 active:bg-slate-700'
                    }`}>
                    <Icon size={22} />
                    <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
