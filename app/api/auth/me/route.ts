import { NextResponse } from 'next/server';
import { getSession, errorResponse } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        uid: session.uid,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
