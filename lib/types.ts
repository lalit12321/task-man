export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TeamRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: TeamRole;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  email: string;
  role: TeamRole;
  photoURL?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  inviteCode: string;
  createdAt: string; // ISO
}

export interface Task {
  id: string;
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null; // ISO
  createdBy: string;
  createdByName: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
