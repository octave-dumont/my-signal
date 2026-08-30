'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, LogIn } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [refused, setRefused] = useState(false)
  const [quote, setQuote] = useState('')
  const [phase, setPhase] = useState<'off' | 'on' | 'gone'>('off')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setRefused(true)
      return
    }
    const data = await res.json()
    if (!data.quote) {
      router.replace('/')
      return
    }
    setQuote(data.quote)
    setPhase('on')
    setTimeout(() => setPhase('gone'), 2600)
    setTimeout(() => router.replace('/'), 3000)
  }

  return (
    <main style={{ justifyContent: 'center' }}>
      <form className="card" onSubmit={submit}>
        <div className="row" style={{ justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="my-signal" width={56} height={56} />
        </div>
        <span className="label">
          <KeyRound size={14} />
          Mot de passe
        </span>
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => {
            setPassword(e.target.value)
            setRefused(false)
          }}
        />
        {refused && <span className="label">Refusé</span>}
        <button type="submit">
          <LogIn size={15} />
          Entrer
        </button>
      </form>
      {phase !== 'off' && (
        /* H32 broken deliberately: the login ritual quote, server-held so the bundle never carries it */
        <div className={phase === 'gone' ? 'quote gone' : 'quote'}>
          <p style={{ maxWidth: '38ch' }}>{quote}</p>
        </div>
      )}
    </main>
  )
}
