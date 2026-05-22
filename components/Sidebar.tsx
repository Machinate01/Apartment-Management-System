'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Gauge, Receipt, BarChart2,
  FileText, Grid3X3, FileSignature, Package, MessageSquare,
  Settings, Upload, LogOut
} from 'lucide-react';

const mainItems = [
  { href: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/rooms', label: 'ผังห้อง', icon: Grid3X3 },
  { href: '/meter', label: 'จดมิเตอร์', icon: Gauge },
  { href: '/billing', label: 'ทำบิล', icon: Receipt },
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
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  };

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}>
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col print:hidden">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-white font-bold text-lg leading-tight">🏠 ระบบห้องเช่า</h1>
        <p className="text-slate-400 text-xs mt-1">Rental Management</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainItems.map(item => <NavLink key={item.href} {...item} />)}
        <div className="border-t border-slate-700 my-2 pt-2 space-y-1">
          {utilItems.map(item => <NavLink key={item.href} {...item} />)}
        </div>
      </nav>
      <div className="p-3 border-t border-slate-700 space-y-2">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
        <p className="text-slate-600 text-xs text-center">v1.1.0</p>
      </div>
    </aside>
  );
}
