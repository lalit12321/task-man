import { NextRequest, NextResponse } from 'next/server';
import { teams, tasks, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { requireTeamAdmin, requireTeamMember } from '@/lib/access';
import { serializeTask } from '@/lib/serialize';
import type { TaskStatus, TaskPriority } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const teamId = req.nextUrl.searchParams.get('teamId');

    const teamCol = await teams();
    const taskCol = await tasks();

    if (teamId) {
      if (!ObjectId.isValid(teamId)) throw new HttpError(400, 'Invalid team id');
      const team = await teamCol.findOne({ _id: new ObjectId(teamId) });
      if (!team) throw new HttpError(404, 'Team not found');
      requireTeamMember(team, session.uid);
      const docs = await taskCol.find({ teamId }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ tasks: docs.map(serializeTask) });
    }

    // No teamId: return all tasks across teams the user belongs to
    const userTeams = await teamCol.find({ 'members.userId': session.uid }).project({ _id: 1 }).toArray();
    const teamIds = userTeams.map((t) => t._id.toString());
    if (teamIds.length === 0) return NextResponse.json({ tasks: [] });
    const docs = await taskCol.find({ teamId: { $in: teamIds } }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ tasks: docs.map(serializeTask) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => ({}));

    const teamId = String(body.teamId ?? '');
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const status = String(body.status ?? 'todo') as TaskStatus;
    const priority = String(body.priority ?? 'medium') as TaskPriority;
    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    const dueDateRaw = body.dueDate ? String(body.dueDate) : null;

    if (!teamId || !ObjectId.isValid(teamId)) throw new HttpError(400, 'Invalid team id');
    if (!title) throw new HttpError(400, 'Title is required');
    if (!VALID_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
    if (!VALID_PRIORITIES.includes(priority)) throw new HttpError(400, 'Invalid priority');

    const teamCol = await teams();
    const team = await teamCol.findOne({ _id: new ObjectId(teamId) });
    if (!team) throw new HttpError(404, 'Team not found');
    requireTeamAdmin(team, session.uid);

    let assigneeName: string | null = null;
    if (assigneeId) {
      const member = team.members.find((m) => m.userId === assigneeId);
      if (!member) throw new HttpError(400, 'Assignee is not a member of this team');
      assigneeName = member.displayName;
    }

    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    if (dueDate && isNaN(dueDate.getTime())) throw new HttpError(400, 'Invalid due date');

    const now = new Date();
    const taskCol = await tasks();
    const result = await taskCol.insertOne({
      teamId,
      title,
      description,
      status,
      priority,
      assigneeId,
      assigneeName,
      dueDate,
      createdBy: session.uid,
      createdByName: session.displayName,
      createdAt: now,
      updatedAt: now,
    } as Parameters<typeof taskCol.insertOne>[0]);

    const doc = await taskCol.findOne({ _id: result.insertedId });
    if (!doc) throw new HttpError(500, 'Failed to load created task');
    return NextResponse.json({ task: serializeTask(doc) });
  } catch (err) {
    return errorResponse(err);
  }
}
