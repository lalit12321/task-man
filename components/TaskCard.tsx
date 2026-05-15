'use client';

import { Task } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './Badges';
import Avatar from './Avatar';
import { Calendar, MoreHorizontal } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  teamName?: string;
}

function formatDate(iso: string | null): { label: string; isOverdue: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    isOverdue: d < new Date(),
  };
}

export default function TaskCard({ task, onClick, teamName }: TaskCardProps) {
  const due = formatDate(task.dueDate);
  const overdueAndOpen = !!due?.isOverdue && task.status !== 'done';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="group w-full text-left card hover:border-ink-400 hover:shadow-card transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <MoreHorizontal className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors shrink-0" />
      </div>

      <h3 className="font-medium text-ink-950 leading-snug mb-1.5 line-clamp-2">
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-ink-500 line-clamp-2 mb-4">{task.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 mt-auto border-t border-ink-100">
        <div className="flex items-center gap-2 min-w-0">
          {task.assigneeName ? (
            <>
              <Avatar name={task.assigneeName} size={22} />
              <span className="text-xs text-ink-600 truncate">{task.assigneeName}</span>
            </>
          ) : (
            <span className="text-xs text-ink-400">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {teamName && (
            <span className="serial !text-[10px] truncate max-w-[80px]">{teamName}</span>
          )}
          {due && (
            <span className={`inline-flex items-center gap-1 text-xs tabular ${overdueAndOpen ? 'text-danger' : 'text-ink-500'}`}>
              <Calendar className="w-3 h-3" />
              {due.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
