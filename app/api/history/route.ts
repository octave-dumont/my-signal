import { fold } from '@/lib/day'
import { getCurrent, lastDays } from '@/lib/store'

export async function GET() {
  const [days, current] = await Promise.all([lastDays(60), getCurrent()])
  const now = Date.now()
  const summaries = days.map((d) => {
    const open = d.date === current.dayKey && current.state !== 'asleep'
    const end = open ? now : d.events[d.events.length - 1]?.t ?? now
    const { signalMs, awakeMs, ratio } = fold(d.events, end)
    return {
      date: d.date,
      open,
      signalMs,
      awakeMs,
      ratio,
      done: d.tasks.filter((t) => t.done).length,
      total: d.tasks.length,
    }
  })
  return Response.json({ days: summaries })
}
