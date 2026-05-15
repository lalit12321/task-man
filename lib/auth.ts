import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'teamflow_token';
const TOKEN_TTL_DAYS = 30;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  // We don't throw at import time in dev, because Next.js may load this file before
  // .env.local is read on certain hot reloads. We'll throw at sign/verify time instead.
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set!');
}

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: `${TOKEN_TTL_DAYS}d` });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & SessionPayload;
    if (!decoded.uid || !decoded.email) return null;
    return {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.displayName ?? '',
      role: decoded.role === 'admin' ? 'admin' : 'member',
    };
  } catch {
    return null;
  }
}

/** Set the auth cookie on a NextResponse (use in route handlers). */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Read & verify the session from cookies. Returns null if no/invalid token. */
export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Read & verify the session from a NextRequest (for use in middleware/route handlers with request access). */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Throw a 401 JSON response if no session. Helper for API routes. */
export function requireSession(): SessionPayload {
  const session = getSession();
  if (!session) {
    throw new HttpError(401, 'Not authenticated');
  }
  return session;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  // eslint-disable-next-line no-console
  console.error('API error:', err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export { COOKIE_NAME };
