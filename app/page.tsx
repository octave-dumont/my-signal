'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, ChevronRight, History, Moon, Sun, Waves, Zap } from 'lucide-react'
import { fold, TARGET, type Day, type State, type TapType } from '@/lib/day'
import type { Current } from '@/lib/store'

const PHRASE = "we're doing it"
const ICONS: Record<string, React.ReactNode> = {
  Wake: <Sun size={18} />,
  Sleep: <Moon size={18} />,
  Signal: <Zap size={18} />,
  Noise: <Waves size={18} />,
}

function fmt(ms: number) {
  const m = Math.floor(ms / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

function b64ToBytes(s: string) {
  const raw = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function post(url: string, body: unknown) {
  await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

function Header({ subscribed, onPush }: { subscribed: boolean; onPush: () => void }) {
  return (
    <div className="row spread">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="my-signal" width={28} height={28} />
      <div className="row">
        <button className="ghost" aria-label="Notifications" onClick={onPush} disabled={subscribed}>
          {subscribed ? <BellRing size={18} /> : <Bell size={18} />}
        </button>
        <Link href="/history" className="btn ghost" aria-label="History">
          <History size={18} />
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

function BigButton({ state, inState, onTap }: { state: State; inState: number; onTap: () => void }) {
  if (state === 'asleep') {
    return (
      <button className="big" onClick={onTap}>
        <Sun />
        Wake
      </button>
    )
  }
  return (
    <button className={state === 'signal' ? 'big signal' : 'big'} onClick={onTap}>
      {state === 'signal' ? <Zap /> : <Waves />}
      {state === 'signal' ? 'Signal' : 'Noise'}
      <span className="label">{fmt(inState)}</span>
    </button>
  )
}

function RatioCard({ totals }: { totals: { signalMs: number; awakeMs: number; ratio: number } }) {
  const pct = Math.round(totals.ratio * 100)
  return (
    <div className="card">
      <div className="row spread">
        <span className="figure">{pct}%</span>
        <span className="label">{TARGET} to beat</span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="mark" style={{ left: `${TARGET}%` }} />
      </div>
      <div className="row spread">
        <span className="row">
          <span className="label">
            <Zap size={14} />
            signal
          </span>
          {fmt(totals.signalMs)}
        </span>
        <span className="row">
          <span className="label">
            <Sun size={14} />
            awake
          </span>
          {fmt(totals.awakeMs)}
        </span>
      </div>
    </div>
  )
}

function TaskList({ day, onSave }: { day: Day; onSave: (tasks: Day['tasks']) => void }) {
  return (
    <div className="card">
      {day.tasks.map((t, i) => (
        <label key={i} className="task">
          <input
            type="checkbox"
            checked={t.done}
            onChange={(e) => onSave(day.tasks.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
          />
          <span className={t.done ? 'done' : ''}>{t.text}</span>
        </label>
      ))}
    </div>
  )
}

function TaskForm({ onSave }: { onSave: (tasks: Day['tasks']) => void }) {
  const [drafts, setDrafts] = useState(['', '', ''])
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(drafts.map((text) => ({ text, done: false })))
      }}
    >
      {drafts.map((d, i) => (
        <input
          key={i}
          type="text"
          value={d}
          placeholder={`${i + 1}`}
          onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      <button type="submit" disabled={drafts.some((d) => !d.trim())}>
        Set
      </button>
    </form>
  )
}

function ConfirmSheet(props: { word: string; typed: boolean; onCancel: () => void; onConfirm: () => void }) {
  const [phrase, setPhrase] = useState('')
  return (
    <div className="overlay" onClick={props.onCancel}>
      <form
        className="card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          props.onConfirm()
        }}
      >
        <span className="row" style={{ justifyContent: 'center', gap: 8 }}>
          {ICONS[props.word]}
          {props.word}?
        </span>
        {props.typed && (
          <input type="text" value={phrase} autoFocus placeholder={PHRASE} onChange={(e) => setPhrase(e.target.value)} />
        )}
        <div className="row">
          <button type="button" className="ghost" style={{ flex: 1 }} onClick={props.onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            style={{ flex: 1 }}
            autoFocus={!props.typed}
            disabled={props.typed && phrase.trim().toLowerCase() !== PHRASE}
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Today() {
  const [current, setCurrent] = useState<Current | null>(null)
  const [day, setDay] = useState<Day | null>(null)
  const [confirming, setConfirming] = useState<TapType | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const res = await fetch('/api/state')
    if (!res.ok) return
    const data = await res.json()
    setCurrent(data.current)
    setDay(data.day)
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(() => setNow(Date.now()), 5000)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(sub !== null))
        .catch(() => {})
    }
    return () => clearInterval(t)
  }, [refresh])

  async function tap(type: TapType) {
    setConfirming(null)
    await post('/api/tap', { type })
    await refresh()
  }

  async function saveTasks(tasks: Day['tasks']) {
    setDay((d) => (d ? { ...d, tasks } : d))
    await post('/api/tasks', { tasks })
    await refresh()
  }

  async function enablePush() {
    const reg = await navigator.serviceWorker.register('/sw.js')
    if ((await Notification.requestPermission()) !== 'granted') return
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })
    await post('/api/push', sub)
    setSubscribed(true)
  }

  if (!current) {
    return (
      <main>
        <div className="card" style={{ flex: 1, opacity: 0.5 }} />
      </main>
    )
  }

  const asleep = current.state === 'asleep'
  const totals = day ? fold(day.events, now) : null
  const confirmWord =
    confirming === 'wake' ? 'Wake' : confirming === 'sleep' ? 'Sleep' : current.state === 'signal' ? 'Noise' : 'Signal'

  return (
    <main>
      <Header subscribed={subscribed} onPush={enablePush} />
      <BigButton
        state={current.state}
        inState={current.lastTap > 0 ? now - current.lastTap : 0}
        onTap={() => setConfirming(asleep ? 'wake' : 'toggle')}
      />
      {totals && totals.awakeMs > 0 && <RatioCard totals={totals} />}
      {day && day.tasks.length === 3 && <TaskList day={day} onSave={saveTasks} />}
      {day && day.tasks.length === 0 && !asleep && <TaskForm onSave={saveTasks} />}
      {!asleep && (
        <button className="ghost" onClick={() => setConfirming('sleep')}>
          <Moon size={16} />
          Sleep
        </button>
      )}
      {confirming && (
        <ConfirmSheet
          word={confirmWord}
          typed={confirming === 'sleep'}
          onCancel={() => setConfirming(null)}
          onConfirm={() => tap(confirming)}
        />
      )}
    </main>
  )
}
