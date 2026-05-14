import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kestrel-auth');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');
  const isCronApi =
    request.nextUrl.pathname.startsWith('/api/cron') ||
    request.nextUrl.pathname.startsWith('/api/scrapers') ||
    request.nextUrl.pathname.startsWith('/api/match') ||
    request.nextUrl.pathname.startsWith('/api/analyze');

  if (isAuthApi || isCronApi) {
    return NextResponse.next();
  }

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
