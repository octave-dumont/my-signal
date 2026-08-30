'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarOff, ChevronLeft, Flame } from 'lucide-react'
import { TARGET } from '@/lib/day'

type Summary = {
  date: string
  open: boolean
  signalMs: number
  awakeMs: number
  ratio: number
  done: number
  total: number
}

function avg(days: Summary[], n: number) {
  const slice = days.slice(-n)
  if (slice.length === 0) return null
  return Math.round((slice.reduce((s, d) => s + d.ratio, 0) / slice.length) * 100)
}

function streak(days: Summary[]) {
  let s = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].ratio * 100 >= TARGET) s++
    else if (!days[i].open) break
  }
  return s
}

function label(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function DayRow({ d }: { d: Summary }) {
  const pct = Math.round(d.ratio * 100)
  return (
    <div className="row" style={{ minHeight: 36 }}>
      <span className="label" style={{ width: 52 }}>
        {label(d.date)}
      </span>
      <div className="track" style={{ flex: 1 }}>
        <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="mark" style={{ left: `${TARGET}%` }} />
      </div>
      <span style={{ width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      <span className="row" style={{ width: 34, gap: 3, justifyContent: 'flex-end' }} aria-label={`${d.done}/${d.total}`}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="dot" data-done={i < d.done} />
        ))}
      </span>
    </div>
  )
}

export default function HistoryPage() {
  const [days, setDays] = useState<Summary[] | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => setDays(data.days))
      .catch(() => setDays([]))
  }, [])

  return (
    <main>
      <div className="row">
        <Link href="/" className="btn ghost" aria-label="Today">
          <ChevronLeft size={18} />
        </Link>
        <span className="label">History</span>
      </div>

      {days === null && <div className="card" style={{ minHeight: 120, opacity: 0.5 }} />}

      {days !== null && days.length === 0 && (
        <div className="card row" style={{ justifyContent: 'center', minHeight: 120 }}>
          <span className="label">
            <CalendarOff size={14} />
            No days yet
          </span>
        </div>
      )}

      {days !== null && days.length > 0 && (
        <>
          <div className="row">
            <div className="card" style={{ flex: 1 }}>
              <span className="label">7d</span>
              <span className="stat">{avg(days, 7) ?? 0}%</span>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <span className="label">30d</span>
              <span className="stat">{avg(days, 30) ?? 0}%</span>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <span className="label">
                <Flame size={14} />
                Streak
              </span>
              <span className="stat">{streak(days)}</span>
            </div>
          </div>
          <div className="card">
            {[...days].reverse().map((d) => (
              <DayRow key={d.date} d={d} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
