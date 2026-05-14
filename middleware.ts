import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kestrel-auth');
  const path = request.nextUrl.pathname;
  const isLandingPage = path === '/landing';
  const isLoginPage = path === '/login';
  const isAuthApi = path.startsWith('/api/auth');
  const isCronApi =
    path.startsWith('/api/cron') ||
    path.startsWith('/api/scrapers') ||
    path.startsWith('/api/match') ||
    path.startsWith('/api/analyze');

  if (isAuthApi || isCronApi) {
    return NextResponse.next();
  }

  if (token && (isLandingPage || isLoginPage)) {
    return NextResponse.redirect(new URL('/opportunities', request.url));
  }

  if (!token && !isLandingPage && !isLoginPage) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
