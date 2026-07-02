import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production'
  )
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('quiz_session')?.value

  let session = null
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret())
      session = payload
    } catch {}
  }

  if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/spelomgang')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  if (
    pathname.startsWith('/spelledare/dashboard') ||
    pathname.startsWith('/spelledare/spelomgang')
  ) {
    if (!session || session.role !== 'spelledare') {
      return NextResponse.redirect(new URL('/spelledare', request.url))
    }
  }

  if (pathname === '/spela/fragor' || pathname === '/spela/tack') {
    if (!session || session.role !== 'spelare') {
      return NextResponse.redirect(new URL('/spela', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/spelomgang/:path*',
    '/spelledare/dashboard/:path*',
    '/spelledare/spelomgang/:path*',
    '/spela/fragor',
    '/spela/tack',
  ],
}
