import { cookies } from 'next/headers'
import { AUTH_COOKIE, newSessionToken, passwordOk } from '@/lib/auth'
import { redis } from '@/lib/store'

export async function POST(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  const tries = await redis.incr(`login:${ip}`)
  if (tries === 1) await redis.expire(`login:${ip}`, 60)
  if (tries > 5) {
    return Response.json({ error: 'too_many_tries' }, { status: 429 })
  }
  let password: unknown
  try {
    ;({ password } = await request.json())
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 })
  }
  if (typeof password !== 'string' || !passwordOk(password)) {
    return Response.json({ error: 'wrong_password' }, { status: 401 })
  }
  const token = newSessionToken()
  await redis.set('session', token)
  const store = await cookies()
  store.set(AUTH_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return Response.json({ ok: true, quote: process.env.LOGIN_QUOTE ?? '' })
}
