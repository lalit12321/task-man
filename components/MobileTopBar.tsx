'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, Users, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',       label: 'Overview', icon: Home },
  { href: '/dashboard/tasks', label: 'My tasks', icon: ListChecks },
  { href: '/dashboard/teams', label: 'Teams',    icon: Users },
];

export default function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'You';

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
    router.replace('/login');
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-ink-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ink-950 rounded grid place-items-center">
              <div className="w-1.5 h-1.5 bg-accent-600 rounded-sm" />
            </div>
            <span className="font-display text-xl">Teamflow</span>
          </Link>
          <button onClick={() => setOpen(true)} className="p-2 -mr-2" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-canvas flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-ink-200">
              <span className="font-display text-xl">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-0.5">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto p-3 border-t border-ink-200">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar name={displayName} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-950 truncate">{displayName}</div>
                  <div className="text-xs text-ink-500 truncate">{user?.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary w-full mt-3">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
