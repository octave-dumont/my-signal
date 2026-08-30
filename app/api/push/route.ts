import { redis } from '@/lib/store'

export async function POST(request: Request) {
  let sub: { endpoint?: string }
  try {
    sub = await request.json()
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 })
  }
  if (!sub?.endpoint) {
    return Response.json({ error: 'not_a_subscription' }, { status: 400 })
  }
  await redis.set('push:sub', sub)
  return Response.json({ ok: true })
}
