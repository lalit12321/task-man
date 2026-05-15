'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listMyTeams } from '@/lib/teams';
import { listAllMyTasks, updateTask, deleteTask } from '@/lib/tasks';
import { Task, Team, TaskStatus, TaskPriority, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import TaskEditor, { TaskFormData } from '@/components/TaskEditor';
import { ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

type ScopeFilter = 'all' | 'mine';
type StatusFilter = TaskStatus | 'all';
type PriorityFilter = TaskPriority | 'all';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<ScopeFilter>('mine');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [editing, setEditing] = useState<Task | null>(null);
  const [editorTeam, setEditorTeam] = useState<Team | null>(null);

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

  const teamNameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (scope === 'mine' ? t.assigneeId === user?.uid : true))
      .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
      .filter((t) => (priorityFilter === 'all' ? true : t.priority === priorityFilter))
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        const order = { high: 0, medium: 1, low: 2 } as const;
        return order[a.priority] - order[b.priority];
      });
  }, [tasks, scope, statusFilter, priorityFilter, user]);

  function openEditor(task: Task) {
    const team = teamById.get(task.teamId);
    if (!team) return;
    const membership = team.members.find((member) => member.userId === user?.uid);
    if (membership?.role !== 'admin') {
      toast.error('Only team admins can edit tasks');
      return;
    }
    setEditorTeam(team);
    setEditing(task);
  }

  async function handleSave(data: TaskFormData) {
    if (!editing) return;
    const updated = await updateTask(editing.id, data);
    setTasks((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
    toast.success('Task updated');
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteTask(editing.id);
    setTasks((prev) => prev.filter((t) => t.id !== editing.id));
    toast.success('Task deleted');
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <div className="mb-8">
        <p className="serial mb-3">Tasks</p>
        <h1 className="font-display text-5xl text-ink-950">Your work, listed.</h1>
        <p className="text-ink-600 mt-2">Everything assigned to you across every team you&rsquo;re in.</p>
      </div>

      <div className="card p-3 mb-6 flex flex-wrap items-center gap-2">
        <SegmentedControl
          value={scope}
          onChange={(v) => setScope(v)}
          options={[{ value: 'mine', label: 'Assigned to me' }, { value: 'all', label: 'All in my teams' }]}
        />
        <div className="h-5 w-px bg-ink-200 mx-1 hidden sm:block" />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: 'all', label: 'All statuses' },
            ...(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
        />
        <FilterSelect
          label="Priority"
          value={priorityFilter}
          onChange={(v) => setPriorityFilter(v as PriorityFilter)}
          options={[
            { value: 'all', label: 'All priorities' },
            ...(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
          ]}
        />
        <div className="ml-auto serial">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card p-5 h-32 animate-pulse bg-ink-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="font-display text-2xl text-ink-950 mb-2">No tasks match those filters</h3>
          <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
            Try widening your filters, or head into a team to create one.
          </p>
          <Link href="/dashboard/teams" className="btn-primary">
            Go to teams <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              teamName={teamNameById.get(task.teamId)}
              onClick={() => openEditor(task)}
            />
          ))}
        </div>
      )}

      {editorTeam && (
        <TaskEditor
          open={!!editing}
          onClose={() => { setEditing(null); setEditorTeam(null); }}
          team={editorTeam}
          task={editing}
          onSubmit={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex p-0.5 bg-ink-100 rounded-lg">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === o.value ? 'bg-white text-ink-950 shadow-soft' : 'text-ink-600 hover:text-ink-950'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-ink-600">
      <span className="hidden sm:inline">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-ink-200 rounded-md px-2 py-1 text-xs font-medium text-ink-900 outline-none hover:border-ink-300 focus:border-ink-900"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
