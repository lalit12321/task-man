'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileTopBar from '@/components/MobileTopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-canvas grid place-items-center">
        <div className="flex items-center gap-2 text-ink-500 text-sm">
          <div className="w-1.5 h-1.5 bg-accent-600 rounded-full animate-pulse" />
          Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <MobileTopBar />
          {children}
        </main>
      </div>
    </div>
  );
}
