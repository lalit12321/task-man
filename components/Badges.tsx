import { TaskStatus, TaskPriority, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg: Record<TaskStatus, { bg: string; dot: string; text: string }> = {
    todo:        { bg: 'bg-ink-100',     dot: 'bg-ink-400',     text: 'text-ink-700' },
    in_progress: { bg: 'bg-amber-50',    dot: 'bg-warning',     text: 'text-amber-900' },
    done:        { bg: 'bg-emerald-50',  dot: 'bg-success',     text: 'text-emerald-900' },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg: Record<TaskPriority, { border: string; text: string }> = {
    low:    { border: 'border-ink-300',  text: 'text-ink-600' },
    medium: { border: 'border-amber-300', text: 'text-warning' },
    high:   { border: 'border-red-300',  text: 'text-danger' },
  };
  const c = cfg[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.border} ${c.text} bg-white`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
