'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogIn } from 'lucide-react'

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
      <form className="card" onSubmit={submit}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/logo-dark.png" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="my-signal" width={88} height={88} />
          </picture>
        </div>
        <span className="label">let&apos;s get stuff done</span>
        <input
          type="text"
          value={password}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setPassword(e.target.value)
            setRefused(false)
          }}
        />
        {refused && <span className="label">Wrong password</span>}
        <button type="submit">
          <LogIn size={15} />
          Enter
        </button>
      </form>
    </main>
  )
}
