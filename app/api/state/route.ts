import { getCurrent, getDay } from '@/lib/store'

export async function GET() {
  const current = await getCurrent()
  const day = current.dayKey ? await getDay(current.dayKey) : null
  return Response.json({ current, day })
}
