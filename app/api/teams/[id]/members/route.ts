import { NextRequest, NextResponse } from 'next/server';
import { teams, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { requireTeamAdmin } from '@/lib/access';
import { serializeTeam } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function objectIdOrThrow(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(400, 'Invalid team id');
  return new ObjectId(id);
}

/**
 * POST /api/teams/[id]/members
 * Add a member to a team. Only admins can add members.
 * Body: { email: string, role?: 'admin' | 'member' }
 */
export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const _id = objectIdOrThrow(ctx.params.id);
    const body = await req.json().catch(() => ({}));

    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');

    // Only admins can add members
    requireTeamAdmin(doc, session.uid);

    const memberEmail = String(body.email ?? '').trim().toLowerCase();
    const memberRole = body.role === 'admin' ? 'admin' : 'member';

    if (!memberEmail) throw new HttpError(400, 'Member email is required');
    if (!memberEmail.includes('@')) throw new HttpError(400, 'Invalid email format');

    // Check if member already exists
    const existingMember = doc.members.find((m) => m.email === memberEmail);
    if (existingMember) {
      throw new HttpError(400, 'This member is already in the team');
    }

    // Add the member with placeholder displayName
    const newMember = {
      userId: '', // Will be filled when the user accepts the invitation
      displayName: memberEmail.split('@')[0],
      email: memberEmail,
      role: memberRole,
      photoURL: null,
    };

    await col.updateOne(
      { _id },
      { $push: { members: newMember } }
    );

    const updated = await col.findOne({ _id });
    if (!updated) throw new HttpError(500, 'Failed to update team');

    return NextResponse.json({
      ok: true,
      team: serializeTeam(updated),
      message: `Member ${memberEmail} added with role: ${memberRole}`,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DELETE /api/teams/[id]/members
 * Remove a member from a team. Only admins can remove members.
 * Body: { email: string }
 */
export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const _id = objectIdOrThrow(ctx.params.id);
    const body = await req.json().catch(() => ({}));

    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');

    // Only admins can remove members
    requireTeamAdmin(doc, session.uid);

    const memberEmail = String(body.email ?? '').trim().toLowerCase();
    if (!memberEmail) throw new HttpError(400, 'Member email is required');

    const member = doc.members.find((m) => m.email === memberEmail);
    if (!member) throw new HttpError(404, 'Member not found in team');

    // Prevent removing the last admin
    const adminCount = doc.members.filter((m) => m.role === 'admin').length;
    if (member.role === 'admin' && adminCount === 1) {
      throw new HttpError(400, 'Cannot remove the last admin from the team');
    }

    await col.updateOne(
      { _id },
      { $pull: { members: { email: memberEmail } } }
    );

    const updated = await col.findOne({ _id });
    if (!updated) throw new HttpError(500, 'Failed to update team');

    return NextResponse.json({
      ok: true,
      team: serializeTeam(updated),
      message: `Member ${memberEmail} removed from team`,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
