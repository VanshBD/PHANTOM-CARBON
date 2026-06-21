import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PAGES       = ['/dashboard', '/chat', '/upload', '/oracle', '/community'];
const PROTECTED_API_PREFIXES = ['/api/carbon', '/api/oracle', '/api/community'];

/** NextAuth v5 wraps the request and attaches `.auth` at runtime */
type NextAuthRequest = Parameters<Parameters<typeof auth>[0]>[0] & {
  auth: { user?: { id?: string; email?: string; name?: string | null } } | null;
};

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some((r) => pathname.startsWith(r));
  const isProtectedApi  = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const session = (req as NextAuthRequest).auth;

  if (!session?.user) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/upload/:path*',
    '/oracle/:path*',
    '/community/:path*',
    '/api/carbon/:path*',
    '/api/oracle/:path*',
    '/api/community/:path*',
  ],
};
