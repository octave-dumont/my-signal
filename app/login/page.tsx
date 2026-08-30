'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [refused, setRefused] = useState(false)

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
    try {
      if (data.quote) sessionStorage.setItem('ms_quote', data.quote)
    } catch {}
    router.replace('/')
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
        {refused && <span className="label">Wrong password</span>}
      </form>
    </main>
  )
}
