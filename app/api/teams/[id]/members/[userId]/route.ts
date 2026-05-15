import { NextRequest, NextResponse } from 'next/server';
import { teams, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { serializeTeam } from '@/lib/serialize';
import type { TeamRole } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES: TeamRole[] = ['admin', 'member'];

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string; userId: string } },
) {
  try {
    const session = requireSession();
    if (!ObjectId.isValid(ctx.params.id)) throw new HttpError(400, 'Invalid team id');

    const body = await req.json().catch(() => ({}));
    const role = String(body.role ?? '') as TeamRole;
    if (!VALID_ROLES.includes(role)) throw new HttpError(400, 'Invalid role');

    const _id = new ObjectId(ctx.params.id);
    const col = await teams();
    const team = await col.findOne({ _id });
    if (!team) throw new HttpError(404, 'Team not found');
    if (team.ownerId !== session.uid) {
      throw new HttpError(403, 'Only the team owner can change member roles');
    }
    if (ctx.params.userId === team.ownerId) {
      throw new HttpError(400, 'The team owner must remain an admin');
    }
    if (!team.members.some((member) => member.userId === ctx.params.userId)) {
      throw new HttpError(404, 'Team member not found');
    }

    await col.updateOne(
      { _id, 'members.userId': ctx.params.userId },
      { $set: { 'members.$.role': role } },
    );

    const updated = await col.findOne({ _id });
    if (!updated) throw new HttpError(500, 'Failed to reload team');
    return NextResponse.json({ team: serializeTeam(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}
