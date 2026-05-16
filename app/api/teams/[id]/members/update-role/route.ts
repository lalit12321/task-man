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
 * PATCH /api/teams/[id]/members/update-role
 * Update a member's role in the team. Only admins can do this.
 * Body: { email: string, role: 'admin' | 'member' }
 */
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    const _id = objectIdOrThrow(ctx.params.id);
    const body = await req.json().catch(() => ({}));

    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');

    // Only admins can update roles
    requireTeamAdmin(doc, session.uid);

    const memberEmail = String(body.email ?? '').trim().toLowerCase();
    const newRole = body.role === 'admin' ? 'admin' : 'member';

    if (!memberEmail) throw new HttpError(400, 'Member email is required');

    const member = doc.members.find((m) => m.email === memberEmail);
    if (!member) throw new HttpError(404, 'Member not found in team');

    // Prevent downgrading the only admin
    if (member.role === 'admin' && newRole === 'member') {
      const adminCount = doc.members.filter((m) => m.role === 'admin').length;
      if (adminCount === 1) {
        throw new HttpError(400, 'Cannot downgrade the only admin in the team');
      }
    }

    await col.updateOne(
      { _id, 'members.email': memberEmail },
      { $set: { 'members.$.role': newRole } }
    );

    const updated = await col.findOne({ _id });
    if (!updated) throw new HttpError(500, 'Failed to update team');

    return NextResponse.json({
      ok: true,
      team: serializeTeam(updated),
      message: `Member ${memberEmail} role updated to ${newRole}`,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
