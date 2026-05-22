import { NextRequest, NextResponse } from 'next/server';

// Paths that don't need authentication
const PUBLIC = ['/login', '/api/auth', '/_next', '/favicon.ico', '/public'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token = req.cookies.get('app_auth')?.value;
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    // If AUTH_SECRET is not set, allow access (dev mode without env)
    return NextResponse.next();
  }

  if (!token || token !== secret) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images.
     * This protects both pages AND API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
