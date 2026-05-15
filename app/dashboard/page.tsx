'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listMyTeams } from '@/lib/teams';
import { listAllMyTasks } from '@/lib/tasks';
import { Team, Task } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import { ArrowUpRight, ListChecks, Users, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [t, ts] = await Promise.all([listMyTeams(), listAllMyTasks()]);
        setTeams(t);
        setTasks(ts);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const stats = useMemo(() => {
    const mine = tasks.filter((t) => t.assigneeId === user?.uid);
    return {
      teamCount: teams.length,
      mineOpen: mine.filter((t) => t.status !== 'done').length,
      mineDone: mine.filter((t) => t.status === 'done').length,
      teamOpen: tasks.filter((t) => t.status !== 'done').length,
    };
  }, [teams, tasks, user]);

  const myActive = tasks
    .filter((t) => t.assigneeId === user?.uid && t.status !== 'done')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 4);

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <div className="mb-10">
        <p className="serial mb-3">Overview · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="font-display text-5xl lg:text-6xl text-ink-950">
          Good to see you,<br />
          <em className="text-accent-700">{user?.displayName?.split(' ')[0] ?? 'there'}.</em>
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200 border border-ink-200 rounded-xl overflow-hidden mb-10">
        <StatCell num="01" label="Teams" value={loading ? '—' : stats.teamCount} icon={<Users className="w-4 h-4" />} />
        <StatCell num="02" label="Your open tasks" value={loading ? '—' : stats.mineOpen} icon={<ListChecks className="w-4 h-4" />} accent />
        <StatCell num="03" label="Your completed" value={loading ? '—' : stats.mineDone} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCell num="04" label="Open across teams" value={loading ? '—' : stats.teamOpen} icon={<ListChecks className="w-4 h-4" />} />
      </div>

      <section className="mb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="serial mb-1.5">Focus</p>
            <h2 className="font-display text-3xl text-ink-950">What&rsquo;s on your plate</h2>
          </div>
          <Link href="/dashboard/tasks" className="text-sm font-medium text-ink-700 hover:text-ink-950 inline-flex items-center gap-1">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : myActive.length === 0 ? (
          <EmptyState
            title="Nothing assigned to you"
            body="When teammates assign tasks to you, they'll show up here."
            href="/dashboard/teams"
            cta="Go to your teams"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {myActive.map((task) => (
              <TaskCard key={task.id} task={task} teamName={teamNameById.get(task.teamId)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="serial mb-1.5">Membership</p>
            <h2 className="font-display text-3xl text-ink-950">Your teams</h2>
          </div>
          <Link href="/dashboard/teams" className="text-sm font-medium text-ink-700 hover:text-ink-950 inline-flex items-center gap-1">
            Manage <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            body="Create your first team or join one with an invite code."
            href="/dashboard/teams"
            cta="Create or join"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="card hover:border-ink-400 hover:shadow-card transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-ink-950 rounded-lg grid place-items-center text-white font-display text-lg">
                    {team.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-ink-700 transition-colors" />
                </div>
                <h3 className="font-medium text-ink-950 mb-1 truncate">{team.name}</h3>
                <p className="text-xs text-ink-500 line-clamp-2 mb-3 min-h-[2.5em]">
                  {team.description || 'No description'}
                </p>
                <div className="serial">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCell({ num, label, value, icon, accent }: { num: string; label: string; value: number | string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-white p-5 ${accent ? 'bg-accent-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="serial">No. {num}</span>
        <div className={`w-7 h-7 rounded-md grid place-items-center ${accent ? 'bg-accent-700 text-white' : 'bg-ink-100 text-ink-900'}`}>
          {icon}
        </div>
      </div>
      <div className="font-display text-4xl text-ink-950 tabular leading-none mb-1">{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-5 h-32 animate-pulse bg-ink-50" />
      ))}
    </div>
  );
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="card p-10 text-center">
      <h3 className="font-display text-2xl text-ink-950 mb-2">{title}</h3>
      <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">{body}</p>
      <Link href={href} className="btn-primary">
        {cta} <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
