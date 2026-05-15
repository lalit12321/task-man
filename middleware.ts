import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'teamflow_token';

// We intentionally don't verify the JWT here (signature verification would
// require importing the secret into the edge runtime). The presence of a
// session cookie is enough for a redirect; API routes do the real verification.
export function middleware(req: NextRequest) {
  const hasToken = !!req.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = req.nextUrl;

  if (!hasToken && pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
