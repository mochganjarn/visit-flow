import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith('/pengunjung') || pathname === '/';
  const isLoginPage = pathname.startsWith('/login');

  // Jika akses root '/', arahkan sesuai status autentikasi
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/pengunjung', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika belum login dan mengakses /pengunjung atau /pengunjung/tambah -> redirect ke /login
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login dan mengakses /login -> redirect ke /pengunjung
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/pengunjung', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/pengunjung/:path*'],
};

