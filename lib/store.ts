import { Redis } from '@upstash/redis'
import type { Day, State } from './day'

export type Current = { dayKey: string | null; state: State; lastTap: number; nagged: number }

export const redis = Redis.fromEnv()

export async function getCurrent(): Promise<Current> {
  return (await redis.get<Current>('current')) ?? { dayKey: null, state: 'asleep', lastTap: 0, nagged: 0 }
}

export async function getDay(key: string): Promise<Day | null> {
  return await redis.get<Day>(`day:${key}`)
}

export async function putDay(day: Day): Promise<void> {
  await redis.set(`day:${day.date}`, day)
  await redis.zadd('days', { score: Number(day.date.replaceAll('-', '')), member: day.date })
}

export async function putCurrent(c: Current): Promise<void> {
  await redis.set('current', c)
}

export async function lastDays(n: number): Promise<Day[]> {
  const keys = await redis.zrange<string[]>('days', -n, -1)
  if (keys.length === 0) return []
  const days = await redis.mget<(Day | null)[]>(...keys.map((k) => `day:${k}`))
  return days.filter((d): d is Day => d !== null)
}
