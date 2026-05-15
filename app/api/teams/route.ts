import { NextRequest, NextResponse } from 'next/server';
import { teams, ensureIndexes, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { serializeTeam, makeInviteCode } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = requireSession();
    const col = await teams();
    const docs = await col.find({ 'members.userId': session.uid }).toArray();
    return NextResponse.json({ teams: docs.map(serializeTeam) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const session = requireSession();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    const description = String(body.description ?? '').trim();

    if (!name) throw new HttpError(400, 'Team name is required');
    if (name.length > 80) throw new HttpError(400, 'Team name is too long');

    const col = await teams();
    // Retry a few times in case of invite-code collision
    let inviteCode = makeInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await col.findOne({ inviteCode });
      if (!exists) break;
      inviteCode = makeInviteCode();
    }

    const result = await col.insertOne({
      name,
      description,
      ownerId: session.uid,
      members: [{
        userId: session.uid,
        displayName: session.displayName,
        email: session.email,
        role: 'admin',
        photoURL: null,
      }],
      inviteCode,
      createdAt: new Date(),
    } as Parameters<typeof col.insertOne>[0]);

    const doc = await col.findOne({ _id: result.insertedId });
    if (!doc) throw new HttpError(500, 'Failed to load created team');
    return NextResponse.json({ team: serializeTeam(doc) });
  } catch (err) {
    return errorResponse(err);
  }
}
