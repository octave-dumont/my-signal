'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Check, ChevronRight, History, Moon, Sun, Waves } from 'lucide-react'
import { fold, TARGET, type Day, type State, type TapType } from '@/lib/day'
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="my-signal" width={30} height={30} />
      <div className="row">
        <button className="ghost" aria-label="Notifications" onClick={onPush} disabled={subscribed}>
          {subscribed ? <BellRing size={17} /> : <Bell size={17} />}
        </button>
        <Link href="/history" className="btn ghost" aria-label="Historique">
          <History size={17} />
          Historique
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function RatioCard({ totals }: { totals: { signalMs: number; awakeMs: number; ratio: number } }) {
  const pct = Math.round(totals.ratio * 100)
  return (
    <div className="card">
      <div className="row spread">
        <span className="figure">{pct}%</span>
        <span className="label tabular">{TARGET} à battre</span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="mark" style={{ left: `${TARGET}%` }} />
      </div>
      <div className="row spread">
        <span className="row">
          <span className="label">
            <WaveGlyph />
            Signal
          </span>
          <span className="tabular">{fmt(totals.signalMs)}</span>
        </span>
        <span className="row">
          <span className="label">
            <Sun size={14} />
            Éveil
          </span>
          <span className="tabular">{fmt(totals.awakeMs)}</span>
        </span>
      </div>
    </div>
  )
}

function StateControl({ state, inState, onAsk }: { state: 'signal' | 'noise'; inState: number; onAsk: () => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label="État">
      <div className="pane" data-at={state === 'signal' ? '0' : '1'} />
      <button role="radio" aria-checked={state === 'signal'} data-on={state === 'signal'} onClick={state === 'noise' ? onAsk : undefined}>
        Signal
        {state === 'signal' && <span className="sub">{fmt(inState)}</span>}
      </button>
      <button role="radio" aria-checked={state === 'noise'} data-on={state === 'noise'} onClick={state === 'signal' ? onAsk : undefined}>
        Bruit
        {state === 'noise' && <span className="sub">{fmt(inState)}</span>}
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
          placeholder={`Tâche ${i + 1}`}
          onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      <button type="submit" disabled={drafts.some((d) => !d.trim())}>
        <Check size={15} />
        Valider
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
              placeholder={`Tâche ${i + 1}`}
              onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
        {props.typed && (
          <input type="text" value={phrase} autoFocus placeholder={PHRASE} onChange={(e) => setPhrase(e.target.value)} />
        )}
        <div className="row">
          <button type="button" className="ghost" style={{ flex: 1 }} onClick={props.onCancel}>
            Annuler
          </button>
          <button type="submit" style={{ flex: 1 }} autoFocus={!props.typed && !props.tasks} disabled={blocked}>
            <Check size={15} />
            Valider
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
    return <ConfirmSheet word="Réveil" icon={<Sun size={17} />} tasks={props.wakeNeedsTasks} {...props} />
  }
  if (props.confirming === 'sleep') {
    return <ConfirmSheet word="Dormir" icon={<Moon size={17} />} typed {...props} />
  }
  const toSignal = props.state === 'noise'
  return (
    <ConfirmSheet
      word={toSignal ? 'Signal' : 'Bruit'}
      icon={toSignal ? <WaveGlyph size={17} /> : <Waves size={17} />}
      {...props}
    />
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

  async function tap(type: TapType, tasks?: string[]) {
    setConfirming(null)
    await post('/api/tap', { type })
    if (tasks) await post('/api/tasks', { tasks: tasks.map((text) => ({ text, done: false })) })
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

  return (
    <main>
      <Header subscribed={subscribed} onPush={enablePush} />
      {totals && totals.awakeMs > 0 && <RatioCard totals={totals} />}
      {current.state === 'asleep' ? (
        <button className="big" onClick={() => setConfirming('wake')}>
          <Sun />
          Réveil
        </button>
      ) : (
        <StateControl
          state={current.state}
          inState={current.lastTap > 0 ? now - current.lastTap : 0}
          onAsk={() => setConfirming('toggle')}
        />
      )}
      {day && day.tasks.length === 3 && <TaskList day={day} onSave={saveTasks} />}
      {day && day.tasks.length === 0 && current.state !== 'asleep' && <TaskForm onSave={saveTasks} />}
      {!asleep && (
        <button className="ghost" onClick={() => setConfirming('sleep')}>
          <Moon size={15} />
          Dormir
        </button>
      )}
      {confirming && (
        <Confirm
          confirming={confirming}
          state={current.state}
          wakeNeedsTasks={!day || day.tasks.length === 0}
          onCancel={() => setConfirming(null)}
          onConfirm={(tasks) => tap(confirming, tasks)}
        />
      )}
    </main>
  )
}
