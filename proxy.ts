import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, authToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/login' || pathname === '/api/login' || pathname === '/api/tick') {
    return NextResponse.next()
  }
  if (request.cookies.get(AUTH_COOKIE)?.value === (await authToken())) {
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next|sw\\.js|logo\\.svg|icon-|apple-icon|manifest|favicon).*)'],
}
