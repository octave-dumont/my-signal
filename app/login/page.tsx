'use client'

import { useState } from 'react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [refused, setRefused] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setPending(false)
      setRefused(true)
      return
    }
    const data = await res.json()
    try {
      sessionStorage.setItem('ms_in', '1')
      if (data.quote) sessionStorage.setItem('ms_quote', data.quote)
      const state = await fetch('/api/state')
      if (state.ok) localStorage.setItem('ms_state', JSON.stringify(await state.json()))
    } catch {}
    window.location.replace('/')
  }

  return (
    <main style={{ justifyContent: 'center' }}>
      <form className="gate" onSubmit={submit}>
        <span className="gate-title">get it done.</span>
        <input
          className="gate-input"
          type="text"
          value={password}
          autoFocus
          disabled={pending}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-label="Password"
          onChange={(e) => {
            setPassword(e.target.value)
            setRefused(false)
          }}
        />
        {pending && <div className="await" />}
        {!pending && refused && <span className="label">Wrong password</span>}
      </form>
    </main>
  )
}
