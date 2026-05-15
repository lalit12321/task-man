import { apiFetch } from './api';
import { Task, TaskPriority, TaskStatus } from './types';

export async function listAllMyTasks(): Promise<Task[]> {
  const { tasks } = await apiFetch<{ tasks: Task[] }>('/api/tasks');
  return tasks;
}

export async function listTasksForTeam(teamId: string): Promise<Task[]> {
  const { tasks } = await apiFetch<{ tasks: Task[] }>(`/api/tasks?teamId=${encodeURIComponent(teamId)}`);
  return tasks;
}

export interface CreateTaskInput {
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null; // ISO date or null
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { task } = await apiFetch<{ task: Task }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return task;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  const { task } = await apiFetch<{ task: Task }>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
}
