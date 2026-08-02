import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const validPaths = new Set([
  '/',
  '/app',
  '/como-medimos',
  '/comparativo',
  '/dns',
  '/historico',
  '/internet-boa-mas-travando',
  '/internet-para-jogos',
  '/jogos',
  '/lag-em-jogos-online',
  '/privacidade',
  '/sobre',
  '/termos',
]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.nextUrl.hostname;

  if (hostname === 'signallq.pages.dev') {
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return NextResponse.next();
    }

    if (url.pathname === '/teste' || url.pathname.startsWith('/teste/')) {
      url.hostname = 'signallq.com';
      url.pathname = '/app';
      url.port = '';
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
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
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
  ],
};
