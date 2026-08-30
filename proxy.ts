import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'
import { redis } from '@/lib/store'

// One session key in Redis: a new login evicts every other device.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/login' || pathname === '/api/login' || pathname === '/api/tick') {
    return NextResponse.next()
  }
  const cookie = request.cookies.get(AUTH_COOKIE)?.value
  if (cookie) {
    try {
      if (cookie === (await redis.get<string>('session'))) {
        return NextResponse.next()
      }
    } catch {}
  }
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next|sw\\.js|logo|icon-|apple-icon|manifest|favicon).*)'],
}
