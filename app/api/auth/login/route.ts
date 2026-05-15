import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { users } from '@/lib/db';
import { signToken, setAuthCookie, errorResponse, HttpError } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const col = await users();
    const user = await col.findOne({ email });
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const uid = user._id.toString();
    const role = user.role === 'admin' ? 'admin' : 'member';
    const token = signToken({
      uid, email: user.email, displayName: user.displayName, role,
    });

    const response = NextResponse.json({
      user: {
        uid, email: user.email, displayName: user.displayName, role,
      },
    });
    setAuthCookie(response, token);
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
