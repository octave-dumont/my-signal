'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Check, ChevronRight, History, Moon, Sun, Waves } from 'lucide-react'
import { dayKey, fold, gradeOf, nextState, TARGET, type Day, type State, type TapType } from '@/lib/day'
import type { Current } from '@/lib/store'

const PHRASE = "we're doing it"

function WaveGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 16 H10 V8 H20" />
    </svg>
  )
}

function fmt(ms: number) {
  const m = Math.floor(ms / 60000)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
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
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet="/logo-dark.png" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="my-signal" width={36} height={36} />
      </picture>
      <div className="row">
        <button className="ghost" aria-label="Notifications" onClick={onPush} disabled={subscribed}>
          {subscribed ? <BellRing size={17} /> : <Bell size={17} />}
        </button>
        <Link href="/history" className="btn ghost" aria-label="History">
          <History size={17} />
          History
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function RatioCard({ totals }: { totals: { signalMs: number; awakeMs: number; ratio: number } }) {
  const pct = Math.round(totals.ratio * 100)
  const grade = { color: `var(--g-${gradeOf(pct)})` }
  return (
    <div className="card">
      <span className="label">
        <WaveGlyph />
        Signal-to-noise
      </span>
      <span className="figure" style={grade}>
        {pct}%
      </span>
      <div className="track" style={grade}>
        <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="mark" style={{ left: `${TARGET}%` }} />
      </div>
    </div>
  )
}

function StateControl(props: { state: 'signal' | 'noise'; signalMs: number; noiseMs: number; onAsk: () => void }) {
  const { state, onAsk } = props
  return (
    <div className="seg" role="radiogroup" aria-label="State">
      <div className="pane" data-at={state === 'signal' ? '0' : '1'} />
      <button role="radio" aria-checked={state === 'signal'} data-on={state === 'signal'} onClick={state === 'noise' ? onAsk : undefined}>
        <span className="row">
          <WaveGlyph size={15} />
          Signal
        </span>
        <span className="sub">{fmt(props.signalMs)}</span>
      </button>
      <button role="radio" aria-checked={state === 'noise'} data-on={state === 'noise'} onClick={state === 'signal' ? onAsk : undefined}>
        <span className="row">
          <Waves size={15} />
          Noise
        </span>
        <span className="sub">{fmt(props.noiseMs)}</span>
      </button>
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
        onSave(drafts.map((text) => ({ text: text.trim(), done: false })))
      }}
    >
      {drafts.map((d, i) => (
        <input
          key={i}
          type="text"
          value={d}
          placeholder={`Task ${i + 1}`}
          onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      <button type="submit" disabled={drafts.some((d) => !d.trim())}>
        <Check size={15} />
        Confirm
      </button>
    </form>
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

function ConfirmSheet(props: {
  word: string
  icon: React.ReactNode
  typed?: boolean
  tasks?: boolean
  onCancel: () => void
  onConfirm: (tasks?: string[]) => void
}) {
  const [phrase, setPhrase] = useState('')
  const [drafts, setDrafts] = useState(['', '', ''])
  const blocked = (props.typed && phrase.trim().toLowerCase() !== PHRASE) || (props.tasks && drafts.some((d) => !d.trim()))
  return (
    <div className="overlay" onClick={props.onCancel}>
      <form
        className="card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          props.onConfirm(props.tasks ? drafts.map((d) => d.trim()) : undefined)
        }}
      >
        <span className="row" style={{ justifyContent: 'center', gap: 8, fontWeight: 500 }}>
          {props.icon}
          {props.word}
        </span>
        {props.tasks &&
          drafts.map((d, i) => (
            <input
              key={i}
              type="text"
              value={d}
              autoFocus={i === 0}
              placeholder={`Task ${i + 1}`}
              onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
        {props.typed && (
          <>
            <span className="label" style={{ justifyContent: 'center' }}>
              write &quot;{PHRASE}&quot; to go to sleep
            </span>
            <input type="text" value={phrase} autoFocus onChange={(e) => setPhrase(e.target.value)} />
          </>
        )}
        <div className="row">
          <button type="button" className="ghost" style={{ flex: 1 }} onClick={props.onCancel}>
            Cancel
          </button>
          <button type="submit" style={{ flex: 1 }} autoFocus={!props.typed && !props.tasks} disabled={blocked}>
            <Check size={15} />
            Confirm
          </button>
        </div>
      </form>
    </div>
  )
}

function Confirm(props: {
  confirming: TapType
  state: State
  wakeNeedsTasks: boolean
  onCancel: () => void
  onConfirm: (tasks?: string[]) => void
}) {
  if (props.confirming === 'wake') {
    return <ConfirmSheet word="Wake up" icon={<Sun size={17} />} tasks={props.wakeNeedsTasks} {...props} />
  }
  if (props.confirming === 'sleep') {
    return <ConfirmSheet word="Sleep" icon={<Moon size={17} />} typed {...props} />
  }
  const toSignal = props.state === 'noise'
  return (
    <ConfirmSheet
      word={toSignal ? 'Signal' : 'Noise'}
      icon={toSignal ? <WaveGlyph size={17} /> : <Waves size={17} />}
      {...props}
    />
  )
}

function LoginQuote() {
  const [quote, setQuote] = useState<string | null>(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    let q: string | null = null
    try {
      q = sessionStorage.getItem('ms_quote')
      if (q) sessionStorage.removeItem('ms_quote')
    } catch {}
    if (!q) return
    setQuote(q)
    const t1 = setTimeout(() => setGone(true), 3600)
    const t2 = setTimeout(() => setQuote(null), 4200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])
  if (!quote) return null
  return (
    /* H32 broken deliberately: the login ritual quote, server-held so the bundle never carries it */
    <div className={gone ? 'quote gone' : 'quote'}>
      <p style={{ maxWidth: '24ch' }}>
        {quote.split(' ').map((w, i) => (
          <span key={i} className="w" style={{ animationDelay: `${i * 70}ms` }}>
            {w}&nbsp;
          </span>
        ))}
      </p>
    </div>
  )
}

function useDay() {
  const [current, setCurrent] = useState<Current | null>(null)
  const [day, setDay] = useState<Day | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const res = await fetch('/api/state')
    if (!res.ok) return
    const data = await res.json()
    setCurrent(data.current)
    setDay(data.day)
    try {
      sessionStorage.setItem('ms_state', JSON.stringify(data))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('ms_state')
      if (cached) {
        const data = JSON.parse(cached)
        setCurrent(data.current)
        setDay(data.day)
      }
    } catch {}
    refresh()
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => sessionStorage.setItem('ms_history', JSON.stringify(data.days)))
      .catch(() => {})
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

  async function tap(type: TapType, tasks?: string[]) {
    const t = Date.now()
    const ns = current ? nextState(current.state, type) : null
    const drafted = tasks ? tasks.map((text) => ({ text, done: false })) : null
    if (ns) {
      setCurrent((c) => (c ? { ...c, state: ns, lastTap: t } : c))
      setNow(t)
      setDay((d) =>
        d
          ? { ...d, events: [...d.events, { t, type }], tasks: drafted ?? d.tasks }
          : { date: dayKey(t), events: [{ t, type }], tasks: drafted ?? [] }
      )
    }
    await post('/api/tap', { type })
    if (drafted) await post('/api/tasks', { tasks: drafted })
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

  return { current, day, subscribed, now, tap, saveTasks, enablePush }
}

export default function Today() {
  const { current, day, subscribed, now, tap, saveTasks, enablePush } = useDay()
  const [confirming, setConfirming] = useState<TapType | null>(null)

  if (!current) {
    return (
      <main>
        <div className="row spread" style={{ minHeight: 44 }}>
          <div className="skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div className="skel" style={{ width: 120, height: 32, borderRadius: 999 }} />
        </div>
        <div className="card skel" style={{ height: 150 }} />
        <div className="skel" style={{ flex: 1, borderRadius: 20 }} />
        <div className="card skel" style={{ height: 170 }} />
      </main>
    )
  }

  const asleep = current.state === 'asleep'
  const totals = day ? fold(day.events, now) : null

  return (
    <main>
      <LoginQuote />
      <Header subscribed={subscribed} onPush={enablePush} />
      {totals && totals.awakeMs > 0 && <RatioCard totals={totals} />}
      {current.state === 'asleep' ? (
        <button className="big" onClick={() => setConfirming('wake')}>
          <Sun />
          Wake up
        </button>
      ) : (
        <StateControl
          state={current.state}
          signalMs={totals?.signalMs ?? 0}
          noiseMs={Math.max(0, (totals?.awakeMs ?? 0) - (totals?.signalMs ?? 0))}
          onAsk={() => setConfirming('toggle')}
        />
      )}
      {day && day.tasks.length === 3 && <TaskList day={day} onSave={saveTasks} />}
      {day && day.tasks.length === 0 && current.state !== 'asleep' && <TaskForm onSave={saveTasks} />}
      {!asleep && (
        <button className="ghost" style={{ marginTop: 'auto' }} onClick={() => setConfirming('sleep')}>
          <Moon size={15} />
          Sleep
        </button>
      )}
      {confirming && (
        <Confirm
          confirming={confirming}
          state={current.state}
          wakeNeedsTasks={!day || day.tasks.length === 0}
          onCancel={() => setConfirming(null)}
          onConfirm={(tasks) => {
            setConfirming(null)
            tap(confirming, tasks)
          }}
        />
      )}
    </main>
  )
}
