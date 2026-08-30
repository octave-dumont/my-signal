'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarOff, ChevronLeft, Flame, ListChecks } from 'lucide-react'
import { gradeOf, TARGET } from '@/lib/day'

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
  if (slice.length === 0) return 0
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
  const grade = { color: `var(--g-${gradeOf(pct)})` }
  return (
    <div className="row" style={{ minHeight: 36 }}>
      <span className="label" style={{ width: 56 }}>
        {label(d.date)}
      </span>
      <div className="track" style={{ flex: 1, ...grade }}>
        <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="mark" style={{ left: `${TARGET}%` }} />
      </div>
      <span className="tabular" style={{ width: 44, textAlign: 'right', ...grade }}>
        {pct}%
      </span>
      <span className="label tabular" style={{ width: 30, justifyContent: 'flex-end' }}>
        {d.done}/{d.total || 3}
      </span>
    </div>
  )
}

function Stats({ days }: { days: Summary[] }) {
  return (
    <div className="row">
      <div className="card" style={{ flex: 1 }}>
        <span className="label">7 days</span>
        <span className="stat" style={{ color: `var(--g-${gradeOf(avg(days, 7))})` }}>
          {avg(days, 7)}%
        </span>
      </div>
      <div className="card" style={{ flex: 1 }}>
        <span className="label">30 days</span>
        <span className="stat" style={{ color: `var(--g-${gradeOf(avg(days, 30))})` }}>
          {avg(days, 30)}%
        </span>
      </div>
      <div className="card" style={{ flex: 1 }}>
        <span className="label">
          <Flame size={14} />
          Streak
        </span>
        <span className="stat">{streak(days)}</span>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [days, setDays] = useState<Summary[] | null>(null)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('ms_history')
      if (cached) setDays(JSON.parse(cached))
    } catch {}
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        setDays(data.days)
        try {
          sessionStorage.setItem('ms_history', JSON.stringify(data.days))
        } catch {}
      })
      .catch(() => setDays((d) => d ?? []))
  }, [])

  return (
    <main>
      <div className="row">
        <Link href="/" className="btn ghost" aria-label="Today">
          <ChevronLeft size={17} />
        </Link>
      </div>

      {days === null && (
        <>
          <div className="row">
            <div className="card skel" style={{ flex: 1, height: 78 }} />
            <div className="card skel" style={{ flex: 1, height: 78 }} />
            <div className="card skel" style={{ flex: 1, height: 78 }} />
          </div>
          <div className="card">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="skel" style={{ height: 24, borderRadius: 6 }} />
            ))}
          </div>
        </>
      )}

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
          <Stats days={days} />
          <div className="card">
            <div className="row spread">
              <span className="label">Signal share per day</span>
              <span className="label">
                <ListChecks size={14} />
                Tasks
              </span>
            </div>
            {[...days].reverse().map((d) => (
              <DayRow key={d.date} d={d} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
