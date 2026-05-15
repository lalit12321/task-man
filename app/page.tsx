'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock, Layers, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-ink-950 rounded-md grid place-items-center">
              <div className="w-2 h-2 bg-accent-600 rounded-sm" />
            </div>
            <span className="font-display text-2xl">Teamflow</span>
          </div>
          <nav className="flex items-center gap-1">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Open dashboard <ArrowUpRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Sign in</Link>
                <Link href="/signup" className="btn-primary">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-paper border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <p className="serial mb-5">Teamflow</p>
          <h1 className="font-display text-5xl md:text-6xl text-ink-950 max-w-3xl">
            Simple team tasks with admin and member access.
          </h1>
          <p className="mt-5 text-lg text-ink-600 max-w-2xl leading-relaxed">
            Create teams, assign work, and keep members focused with clear role permissions.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={user ? '/dashboard' : '/signup'} className="btn-primary !px-6 !py-3 text-base">
              {user ? 'Go to dashboard' : 'Create your workspace'}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary !px-6 !py-3 text-base">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-12 gap-12 mb-14">
            <div className="lg:col-span-4">
              <p className="serial mb-4">Features</p>
              <h2 className="font-display text-4xl text-ink-950">Everything your team needs.</h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-lg text-ink-600 leading-relaxed">
                Teams get a clean task board, invite-based collaboration, and permissions that separate admins from members.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-ink-200 border border-ink-200 rounded-xl overflow-hidden">
            <FeatureBlock
              num="01"
              icon={<Users className="w-5 h-5" />}
              title="Teams"
              body="Create workspaces, invite collaborators, and manage who can change team work."
            />
            <FeatureBlock
              num="02"
              icon={<Layers className="w-5 h-5" />}
              title="Tasks"
              body="Track title, status, priority, assignee, due date, and details without extra clutter."
            />
            <FeatureBlock
              num="03"
              icon={<Clock className="w-5 h-5" />}
              title="Focus"
              body="See what is assigned to you across every team and keep the next action visible."
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <div>Copyright {new Date().getFullYear()} Teamflow. A calm task manager.</div>
          <div className="serial">Built with Next.js</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBlock({
  num, icon, title, body,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-8 lg:p-10 hover:bg-canvas transition-colors">
      <div className="flex items-center justify-between mb-8">
        <span className="serial">No. {num}</span>
        <div className="w-9 h-9 bg-ink-100 rounded-lg grid place-items-center text-ink-900">{icon}</div>
      </div>
      <h3 className="font-display text-3xl text-ink-950 mb-3">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}
