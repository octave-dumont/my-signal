import type { Task } from '@/lib/day'
import { getCurrent, getDay, putDay } from '@/lib/store'

export async function POST(request: Request) {
  const { tasks } = (await request.json()) as { tasks: Task[] }
  if (!Array.isArray(tasks) || tasks.length !== 3 || tasks.some((t) => typeof t.text !== 'string' || !t.text.trim() || typeof t.done !== 'boolean')) {
    return Response.json({ error: 'three_tasks_exactly' }, { status: 400 })
  }
  const current = await getCurrent()
  if (!current.dayKey) {
    return Response.json({ error: 'no_open_day' }, { status: 409 })
  }
  const day = await getDay(current.dayKey)
  if (!day) {
    return Response.json({ error: 'no_open_day' }, { status: 409 })
  }
  day.tasks = tasks.map((t) => ({ text: t.text.trim(), done: t.done }))
  await putDay(day)
  return Response.json({ day })
}
