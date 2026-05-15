import { NextRequest, NextResponse } from 'next/server';
import { teams, tasks, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { requireTeamMember } from '@/lib/access';
import { serializeTeam } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function objectIdOrThrow(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(400, 'Invalid team id');
  return new ObjectId(id);
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const _id = objectIdOrThrow(ctx.params.id);
    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');
    requireTeamMember(doc, session.uid);
    return NextResponse.json({ team: serializeTeam(doc) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const _id = objectIdOrThrow(ctx.params.id);
    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');
    if (doc.ownerId !== session.uid) {
      throw new HttpError(403, 'Only the team owner can delete this team');
    }
    // Cascade: delete tasks then team
    const taskCol = await tasks();
    await taskCol.deleteMany({ teamId: ctx.params.id });
    await col.deleteOne({ _id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
