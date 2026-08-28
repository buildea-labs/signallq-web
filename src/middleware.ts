import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const validPaths = new Set(['/', '/privacidade', '/termos']);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.nextUrl.hostname;

  if (hostname === 'signallq.pages.dev') {
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return NextResponse.next();
    }

    url.hostname = 'signallq.com';
    url.port = '';
    url.protocol = 'https:';

    // Se for uma rota que não é equivalente a uma das válidas conhecidas
    if (!validPaths.has(url.pathname)) {
      url.pathname = '/';
    }

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
