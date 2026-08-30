import webpush, { type PushSubscription } from 'web-push'
import { getCurrent, putCurrent, redis } from '@/lib/store'

const LEASH_MS = 2 * 60 * 60 * 1000

export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get('key') !== process.env.TICK_KEY) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const current = await getCurrent()
  const now = Date.now()
  if (current.state === 'asleep' || now - current.lastTap < LEASH_MS || now - current.nagged < LEASH_MS) {
    return Response.json({ ok: true, nagged: false })
  }
  const sub = await redis.get<PushSubscription>('push:sub')
  if (!sub) {
    return Response.json({ ok: true, nagged: false, error: 'no_subscription' })
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
  await webpush.sendNotification(sub, JSON.stringify({ title: 'my-signal', body: `Still in ${current.state}?` }))
  await putCurrent({ ...current, nagged: now })
  return Response.json({ ok: true, nagged: true })
}
