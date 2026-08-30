export type TapType = 'wake' | 'toggle' | 'sleep'
export type DayEvent = { t: number; type: TapType }
export type Task = { text: string; done: boolean }
export type Day = { date: string; events: DayEvent[]; tasks: Task[] }
export type State = 'asleep' | 'signal' | 'noise'

export const TARGET = 80
export const TZ = 'Europe/Paris'

// A day is owned by its wake date in Paris time.
export function dayKey(t: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(t))
}

// Wake lands in noise, toggle flips, sleep closes; an open day is measured up to `now`.
export function fold(events: DayEvent[], now: number) {
  let state: State = 'asleep'
  let since = 0
  let signalMs = 0
  let awakeMs = 0
  const close = (until: number) => {
    if (state === 'asleep') return
    awakeMs += until - since
    if (state === 'signal') signalMs += until - since
  }
  for (const e of events) {
    if (e.type === 'wake' && state === 'asleep') {
      state = 'noise'
      since = e.t
    } else if (e.type === 'toggle' && state !== 'asleep') {
      close(e.t)
      state = state === 'signal' ? 'noise' : 'signal'
      since = e.t
    } else if (e.type === 'sleep' && state !== 'asleep') {
      close(e.t)
      state = 'asleep'
    }
  }
  close(now)
  return { state, signalMs, awakeMs, ratio: awakeMs > 0 ? signalMs / awakeMs : 0 }
}

// The next state a tap would produce, or null if the tap is illegal now.
export function nextState(state: State, tap: TapType): State | null {
  if (tap === 'wake') return state === 'asleep' ? 'noise' : null
  if (state === 'asleep') return null
  if (tap === 'sleep') return 'asleep'
  return state === 'signal' ? 'noise' : 'signal'
}
