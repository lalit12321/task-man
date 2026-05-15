'use client';

import { useEffect, useState } from 'react';
import { Task, Team, TaskPriority, TaskStatus, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import Modal from './Modal';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskEditorProps {
  open: boolean;
  onClose: () => void;
  team: Team;
  task?: Task | null;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null; // ISO yyyy-mm-dd or null
}

function isoDateForInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TaskEditor({ open, onClose, team, task, onSubmit, onDelete }: TaskEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId ?? '');
      setDueDate(isoDateForInput(task.dueDate));
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssigneeId('');
      setDueDate('');
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        // We send midnight local time as a full ISO; the server stores it as a Date.
        dueDate: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save task';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete task';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'} subtitle={`In team: ${team.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Migrate payments to v3 API"
            className="input"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, acceptance criteria, links…"
            rows={4}
            className="input resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="input">
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="input">
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="input">
              <option value="">Unassigned</option>
              {team.members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-ink-100">
          <div>
            {task && onDelete && (
              <button type="button" onClick={handleDelete} disabled={submitting} className="btn-danger">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
