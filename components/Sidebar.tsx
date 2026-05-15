'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, Users, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',       label: 'Overview', icon: Home },
  { href: '/dashboard/tasks', label: 'My tasks', icon: ListChecks },
  { href: '/dashboard/teams', label: 'Teams',    icon: Users },
];

export default function Sidebar() {
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
    <aside className="hidden lg:flex w-64 shrink-0 border-r border-ink-200 bg-canvas flex-col h-screen sticky top-0">
      <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-ink-950 rounded-md grid place-items-center">
          <div className="w-2 h-2 bg-accent-600 rounded-sm" />
        </div>
        <Link href="/" className="font-display text-2xl text-ink-950">Teamflow</Link>
      </div>

      <div className="px-3 mt-4">
        <p className="serial px-3 mb-2">Workspace</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-950'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 mt-8">
        <p className="serial px-3 mb-2">Quick action</p>
        <Link href="/dashboard/teams" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-700 hover:bg-accent-50 transition-colors">
          <Plus className="w-4 h-4" />
          New team or task
        </Link>
      </div>

      <div className="mt-auto p-3 border-t border-ink-200">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar name={displayName} size={32} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink-950 truncate">{displayName}</div>
            <div className="text-xs text-ink-500 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-ink-500 hover:text-ink-950 hover:bg-ink-100 rounded-md transition-colors" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
