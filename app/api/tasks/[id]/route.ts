import { NextRequest, NextResponse } from 'next/server';
import { teams, tasks, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { requireTeamAdmin, requireTeamMember } from '@/lib/access';
import { serializeTask } from '@/lib/serialize';
import type { TaskStatus, TaskPriority } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

async function authorizedTaskOrThrow(taskId: string, uid: string) {
  if (!ObjectId.isValid(taskId)) throw new HttpError(400, 'Invalid task id');
  const taskCol = await tasks();
  const task = await taskCol.findOne({ _id: new ObjectId(taskId) });
  if (!task) throw new HttpError(404, 'Task not found');
  const teamCol = await teams();
  const team = await teamCol.findOne({ _id: new ObjectId(task.teamId) });
  if (!team) throw new HttpError(404, 'Team not found');
  requireTeamMember(team, uid);
  return { task, team, taskCol };
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const { task, team, taskCol } = await authorizedTaskOrThrow(ctx.params.id, session.uid);
    requireTeamAdmin(team, session.uid);
    const body = await req.json().catch(() => ({}));

    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) throw new HttpError(400, 'Title cannot be empty');
      update.title = title;
    }
    if (typeof body.description === 'string') {
      update.description = body.description.trim();
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) throw new HttpError(400, 'Invalid status');
      update.status = body.status;
    }
    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(body.priority)) throw new HttpError(400, 'Invalid priority');
      update.priority = body.priority;
    }
    if ('assigneeId' in body) {
      const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
      let assigneeName: string | null = null;
      if (assigneeId) {
        const member = team.members.find((m) => m.userId === assigneeId);
        if (!member) throw new HttpError(400, 'Assignee is not a member of this team');
        assigneeName = member.displayName;
      }
      update.assigneeId = assigneeId;
      update.assigneeName = assigneeName;
    }
    if ('dueDate' in body) {
      if (body.dueDate === null || body.dueDate === '') {
        update.dueDate = null;
      } else {
        const d = new Date(String(body.dueDate));
        if (isNaN(d.getTime())) throw new HttpError(400, 'Invalid due date');
        update.dueDate = d;
      }
    }

    await taskCol.updateOne({ _id: task._id }, { $set: update });
    const updated = await taskCol.findOne({ _id: task._id });
    if (!updated) throw new HttpError(500, 'Failed to reload task');
    return NextResponse.json({ task: serializeTask(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const { task, team, taskCol } = await authorizedTaskOrThrow(ctx.params.id, session.uid);
    requireTeamAdmin(team, session.uid);
    await taskCol.deleteOne({ _id: task._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
