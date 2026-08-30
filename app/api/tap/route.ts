import { dayKey, nextState, type TapType } from '@/lib/day'
import { getCurrent, getDay, putCurrent, putDay } from '@/lib/store'

export async function POST(request: Request) {
  let type: TapType
  try {
    ;({ type } = (await request.json()) as { type: TapType })
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 })
  }
  if (!['wake', 'toggle', 'sleep'].includes(type)) {
    return Response.json({ error: 'unknown_tap' }, { status: 400 })
  }
  const current = await getCurrent()
  const state = nextState(current.state, type)
  if (state === null) {
    return Response.json({ error: 'illegal_tap', from: current.state }, { status: 409 })
  }
  const now = Date.now()
  const key = type === 'wake' ? dayKey(now) : current.dayKey!
  const day = (await getDay(key)) ?? { date: key, events: [], tasks: [] }
  day.events.push({ t: now, type })
  await putDay(day)
  await putCurrent({ dayKey: key, state, lastTap: now, nagged: 0 })
  return Response.json({ state, day })
}
