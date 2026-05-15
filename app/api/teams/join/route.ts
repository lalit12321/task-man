import { NextRequest, NextResponse } from 'next/server';
import { teams } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { serializeTeam } from '@/lib/serialize';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => ({}));
    const inviteCode = String(body.inviteCode ?? '').trim().toUpperCase();
    if (!inviteCode) throw new HttpError(400, 'Invite code is required');

    const col = await teams();
    const team = await col.findOne({ inviteCode });
    if (!team) throw new HttpError(404, 'No team found for that invite code');

    if (team.members.some((m) => m.userId === session.uid)) {
      return NextResponse.json({ team: serializeTeam(team), alreadyMember: true });
    }

    await col.updateOne(
      { _id: team._id },
      {
        $push: {
          members: {
            userId: session.uid,
            displayName: session.displayName,
            email: session.email,
            role: session.role,
            photoURL: null,
          },
        },
      },
    );

    const updated = await col.findOne({ _id: team._id });
    if (!updated) throw new HttpError(500, 'Failed to reload team');
    return NextResponse.json({ team: serializeTeam(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}
