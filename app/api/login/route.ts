import { cookies } from 'next/headers'
import { AUTH_COOKIE, authToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { password } = await request.json()
  if (password !== process.env.APP_PASSWORD) {
    return Response.json({ error: 'wrong_password' }, { status: 401 })
  }
  const store = await cookies()
  store.set(AUTH_COOKIE, await authToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  return Response.json({ ok: true, quote: process.env.LOGIN_QUOTE ?? '' })
}
