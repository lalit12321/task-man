'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getTeam, leaveTeam, deleteTeam, regenerateInviteCode, updateMemberRole } from '@/lib/teams';
import { createTask, listTasksForTeam, updateTask, deleteTask } from '@/lib/tasks';
import { Task, Team, TeamRole, TaskStatus, STATUS_LABELS } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import TaskEditor, { TaskFormData } from '@/components/TaskEditor';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';
import { ArrowLeft, Plus, Copy, RefreshCw, LogOut, Trash2, Users, Settings, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!user || !teamId) return;
    (async () => {
      try {
        const t = await getTeam(teamId);
        setTeam(t);
        const ts = await listTasksForTeam(teamId);
        setTasks(ts);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load team';
        toast.error(message);
        router.replace('/dashboard/teams');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [user, teamId, router]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((t) => groups[t.status].push(t));
    const order = { high: 0, medium: 1, low: 2 } as const;
    (Object.keys(groups) as TaskStatus[]).forEach((k) => {
      groups[k].sort((a, b) => order[a.priority] - order[b.priority]);
    });
    return groups;
  }, [tasks]);

  function openNewTask() {
    setEditingTask(null);
    setShowEditor(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setShowEditor(true);
  }

  async function handleSaveTask(data: TaskFormData) {
    if (!team) return;
    if (editingTask) {
      const updated = await updateTask(editingTask.id, data);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      toast.success('Task updated');
    } else {
      const created = await createTask({ ...data, teamId: team.id });
      setTasks((prev) => [created, ...prev]);
      toast.success('Task created');
    }
  }

  async function handleDeleteTask() {
    if (!editingTask) return;
    await deleteTask(editingTask.id);
    setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
    toast.success('Task deleted');
  }

  if (loading || !team || !user) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-20 bg-ink-100 rounded" />
          <div className="h-12 w-64 bg-ink-100 rounded" />
          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            {[0, 1, 2].map((i) => <div key={i} className="h-64 bg-ink-50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const isOwner = team.ownerId === user.uid;
  const currentMember = team.members.find((member) => member.userId === user.uid);
  const isAdmin = currentMember?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-950 mb-4">
        <ArrowLeft className="w-4 h-4" /> All teams
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="serial mb-2">Team · {team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
          <h1 className="font-display text-5xl text-ink-950">{team.name}</h1>
          {team.description && <p className="text-ink-600 mt-2 max-w-2xl">{team.description}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowSettings(true)} className="btn-secondary">
            <Settings className="w-4 h-4" /> Settings
          </button>
          {isAdmin ? (
            <button onClick={openNewTask} className="btn-primary">
              <Plus className="w-4 h-4" /> New task
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-600 bg-ink-100 rounded-lg">
              <Lock className="w-4 h-4" /> View only
            </span>
          )}
        </div>
      </div>

      <div className="card p-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <Users className="w-4 h-4 text-ink-500" />
          <span className="text-xs font-medium text-ink-700 uppercase tracking-wider">Members</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {team.members.map((m) => (
            <div key={m.userId} className="inline-flex items-center gap-1.5 bg-ink-50 rounded-full pl-1 pr-3 py-1">
              <Avatar name={m.displayName} size={20} />
              <span className="text-xs font-medium text-ink-900">{m.displayName}</span>
              {m.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-accent-700 font-medium uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="serial">Invite</span>
          <code className="font-mono text-sm font-medium bg-ink-950 text-white px-2.5 py-1 rounded-md tracking-widest">{team.inviteCode}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(team.inviteCode); toast.success('Code copied'); }}
            className="p-1.5 text-ink-500 hover:text-ink-950 hover:bg-ink-100 rounded-md transition-colors"
            aria-label="Copy invite code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            canManage={isAdmin}
            onTaskClick={isAdmin ? openEditTask : undefined}
            onAddClick={isAdmin ? openNewTask : undefined}
          />
        ))}
      </div>

      <TaskEditor
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditingTask(null); }}
        team={team}
        task={editingTask}
        onSubmit={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        team={team}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onTeamUpdated={setTeam}
        onCodeRegenerated={(code) => setTeam((t) => (t ? { ...t, inviteCode: code } : t))}
        onLeft={() => router.replace('/dashboard/teams')}
        onDeleted={() => router.replace('/dashboard/teams')}
      />
    </div>
  );
}

function TaskColumn({
  status, tasks, canManage, onTaskClick, onAddClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  canManage: boolean;
  onTaskClick?: (t: Task) => void;
  onAddClick?: () => void;
}) {
  const headerColors: Record<TaskStatus, string> = {
    todo: 'bg-ink-100 text-ink-700',
    in_progress: 'bg-amber-50 text-warning',
    done: 'bg-emerald-50 text-success',
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between sticky top-14 lg:top-0 bg-canvas py-2 z-10">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-md ${headerColors[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          <span className="serial tabular">{tasks.length}</span>
        </div>
        {status === 'todo' && canManage && onAddClick && (
          <button onClick={onAddClick} className="p-1 text-ink-500 hover:text-ink-950 hover:bg-ink-100 rounded transition-colors" aria-label="Add task">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="border border-dashed border-ink-200 rounded-xl p-6 text-center">
          <p className="text-xs text-ink-400">Nothing here yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick ? () => onTaskClick(task) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsModal({
  open, onClose, team, isOwner, isAdmin, onTeamUpdated, onCodeRegenerated, onLeft, onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  team: Team;
  isOwner: boolean;
  isAdmin: boolean;
  onTeamUpdated: (team: Team) => void;
  onCodeRegenerated: (code: string) => void;
  onLeft: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [memberBusy, setMemberBusy] = useState<string | null>(null);

  async function handleRegen() {
    setBusy(true);
    try {
      const code = await regenerateInviteCode(team.id);
      onCodeRegenerated(code);
      toast.success('New code generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not regenerate code');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!confirm('Leave this team? You\'ll lose access to its tasks.')) return;
    setBusy(true);
    try {
      await leaveTeam(team.id);
      toast.success('Left team');
      onLeft();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave team');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${team.name}" and all its tasks? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteTeam(team.id);
      toast.success('Team deleted');
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete team');
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId: string, role: TeamRole) {
    setMemberBusy(userId);
    try {
      const updated = await updateMemberRole(team.id, userId, role);
      onTeamUpdated(updated);
      toast.success('Member role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update member role');
    } finally {
      setMemberBusy(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Team settings" subtitle={team.name}>
      <div className="space-y-6">
        <div>
          <p className="label">Role access</p>
          <div className="space-y-2">
            {team.members.map((member) => {
              const isTeamOwner = member.userId === team.ownerId;
              return (
                <div key={member.userId} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={member.displayName} size={24} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-950 truncate">{member.displayName}</p>
                      <p className="text-xs text-ink-500 truncate">{member.email}</p>
                    </div>
                  </div>
                  {isOwner && !isTeamOwner ? (
                    <select
                      value={member.role}
                      onChange={(event) => handleRoleChange(member.userId, event.target.value as TeamRole)}
                      disabled={memberBusy === member.userId}
                      className="bg-white border border-ink-200 rounded-md px-2 py-1 text-xs font-medium text-ink-900 outline-none hover:border-ink-300 focus:border-ink-900"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className="serial !text-accent-700">{isTeamOwner ? 'Owner' : member.role}</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-500 mt-2">Admins can manage tasks and invite codes. Members have view-only access to team tasks.</p>
        </div>

        <div>
          <p className="label">Invite code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-base font-medium bg-ink-950 text-white px-4 py-2.5 rounded-lg tracking-widest text-center">
              {team.inviteCode}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(team.inviteCode); toast.success('Copied'); }}
              className="btn-secondary !px-3" aria-label="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button onClick={handleRegen} disabled={busy} className="btn-secondary !px-3" aria-label="Regenerate code">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-2">
            {isAdmin ? 'Admins can share or regenerate this team invite code.' : 'Ask a team admin if you need a new invite code.'}
          </p>
        </div>

        <div className="pt-6 border-t border-ink-100 space-y-3">
          <p className="label">Danger zone</p>
          {!isOwner && (
            <button onClick={handleLeave} disabled={busy} className="btn-secondary w-full justify-start">
              <LogOut className="w-4 h-4" /> Leave this team
            </button>
          )}
          {isOwner && (
            <>
              <p className="text-xs text-ink-500">
                As the owner, you can&rsquo;t leave — only delete. Deleting removes all tasks and member access.
              </p>
              <button onClick={handleDelete} disabled={busy} className="btn-danger w-full justify-start">
                <Trash2 className="w-4 h-4" /> Delete team permanently
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
