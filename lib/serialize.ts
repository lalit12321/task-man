import { TeamDoc, TaskDoc } from './db';
import { Team, Task } from './types';

export function serializeTeam(doc: TeamDoc): Team {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    ownerId: doc.ownerId,
    members: doc.members,
    inviteCode: doc.inviteCode,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function serializeTask(doc: TaskDoc): Task {
  return {
    id: doc._id.toString(),
    teamId: doc.teamId,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    assigneeId: doc.assigneeId,
    assigneeName: doc.assigneeName,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function makeInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
