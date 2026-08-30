import { redis } from '@/lib/store'

export async function POST(request: Request) {
  const sub = await request.json()
  if (!sub?.endpoint) {
    return Response.json({ error: 'not_a_subscription' }, { status: 400 })
  }
  await redis.set('push:sub', sub)
  return Response.json({ ok: true })
}
