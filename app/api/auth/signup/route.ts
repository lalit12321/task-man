import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { users, ensureIndexes } from '@/lib/db';
import { signToken, setAuthCookie, errorResponse, HttpError } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const displayName = String(body.displayName ?? '').trim();
    const role = body.role === 'admin' ? 'admin' : 'member';

    if (!email || !password || !displayName) {
      throw new HttpError(400, 'Email, password and display name are required');
    }
    if (password.length < 6) {
      throw new HttpError(400, 'Password must be at least 6 characters');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Invalid email address');
    }

    const col = await users();
    const existing = await col.findOne({ email });
    if (existing) {
      throw new HttpError(409, 'An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await col.insertOne({
      email,
      passwordHash,
      displayName,
      role,
      createdAt: new Date(),
    } as Parameters<typeof col.insertOne>[0]);

    const uid = result.insertedId.toString();
    const token = signToken({
      uid, email, displayName, role,
    });

    const response = NextResponse.json({
      user: {
        uid, email, displayName, role,
      },
    });
    setAuthCookie(response, token);
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
