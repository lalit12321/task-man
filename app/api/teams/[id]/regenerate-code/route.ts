import { NextRequest, NextResponse } from 'next/server';
import { teams, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';
import { requireTeamAdmin } from '@/lib/access';
import { makeInviteCode } from '@/lib/serialize';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    if (!ObjectId.isValid(ctx.params.id)) throw new HttpError(400, 'Invalid team id');
    const _id = new ObjectId(ctx.params.id);
    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');
    requireTeamAdmin(doc, session.uid);
    let inviteCode = makeInviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await col.findOne({ inviteCode });
      if (!clash || clash._id.equals(_id)) break;
      inviteCode = makeInviteCode();
    }
    await col.updateOne({ _id }, { $set: { inviteCode } });
    return NextResponse.json({ inviteCode });
  } catch (err) {
    return errorResponse(err);
  }
}
