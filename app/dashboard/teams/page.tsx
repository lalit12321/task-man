'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createTeam, listMyTeams, joinTeamByCode } from '@/lib/teams';
import { Team } from '@/lib/types';
import { Plus, KeyRound, ArrowUpRight, Users } from 'lucide-react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  async function refresh() {
    setLoading(true);
    try {
      const t = await listMyTeams();
      setTeams(t);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="serial mb-3">Teams</p>
          <h1 className="font-display text-5xl text-ink-950">Workspaces.</h1>
          <p className="text-ink-600 mt-2">Create a team or join one with an invite code.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="btn-secondary">
            <KeyRound className="w-4 h-4" /> Join with code
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="card p-6 h-44 animate-pulse bg-ink-50" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="card p-12 text-center bg-paper">
          <div className="w-12 h-12 bg-ink-950 rounded-xl mx-auto mb-4 grid place-items-center text-white">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-display text-3xl text-ink-950 mb-2">Start your first team</h3>
          <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
            Create a workspace and invite your teammates with a 6-character code.
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setShowJoin(true)} className="btn-secondary">Join existing</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create team</button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team) => {
            const isOwner = team.ownerId === user?.uid;
            const membership = team.members.find((member) => member.userId === user?.uid);
            return (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="card hover:border-ink-400 hover:shadow-card transition-all p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-ink-950 rounded-lg grid place-items-center text-white font-display text-xl">
                    {team.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="serial !text-accent-700">{isOwner ? 'Owner' : membership?.role ?? 'Member'}</span>
                </div>
                <h3 className="font-display text-2xl text-ink-950 mb-1 truncate">{team.name}</h3>
                <p className="text-sm text-ink-500 line-clamp-2 mb-5 min-h-[2.5em]">
                  {team.description || 'No description'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                  <span className="serial">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                  <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-ink-700 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateTeamModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refresh} />
      <JoinTeamModal open={showJoin} onClose={() => setShowJoin(false)} onJoined={refresh} />
    </div>
  );
}

function CreateTeamModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createTeam({ name: name.trim(), description: description.trim() });
      toast.success(`Team "${name}" created`);
      setName(''); setDescription('');
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create team';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New team" subtitle="Workspaces are independent — members, tasks, settings.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Team name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Acme Engineering" className="input" autoFocus required
          />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team work on?" rows={3} className="input resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function JoinTeamModal({ open, onClose, onJoined }: { open: boolean; onClose: () => void; onJoined: () => void }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const team = await joinTeamByCode(code.trim());
      toast.success(`Joined "${team.name}"`);
      setCode('');
      onJoined();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join team';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join a team" subtitle="Paste the 6-character invite code shared with you.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Invite code</label>
          <input
            type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A1B2C3" maxLength={6}
            className="input font-mono text-center tracking-[0.3em] text-lg !py-3"
            autoFocus required
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Joining…' : 'Join team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
