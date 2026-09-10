'use client'

import { useState } from 'react'
import { AudioWaveform, Check, Moon, Sun, Waves } from 'lucide-react'
import type { Day, State, TapType } from '@/lib/day'
import { PHRASE, phraseOk } from '@/lib/phrase'

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
  const blocked = (props.typed && !phraseOk(phrase)) || (props.tasks && drafts.some((d) => !d.trim()))
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
            <input type="text" value={phrase} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => setPhrase(e.target.value)} />
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

export function Confirm(props: {
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
      icon={toSignal ? <AudioWaveform size={17} /> : <Waves size={17} />}
      {...props}
    />
  )
}
