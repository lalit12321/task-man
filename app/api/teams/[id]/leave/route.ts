import { NextRequest, NextResponse } from 'next/server';
import { teams, ObjectId } from '@/lib/db';
import { requireSession, errorResponse, HttpError } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = requireSession();
    if (!ObjectId.isValid(ctx.params.id)) throw new HttpError(400, 'Invalid team id');
    const _id = new ObjectId(ctx.params.id);
    const col = await teams();
    const doc = await col.findOne({ _id });
    if (!doc) throw new HttpError(404, 'Team not found');
    if (doc.ownerId === session.uid) {
      throw new HttpError(400, 'Team owners must delete the team rather than leave it');
    }
    await col.updateOne(
      { _id },
      { $pull: { members: { userId: session.uid } } },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
