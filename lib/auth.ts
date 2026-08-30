import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const AUTH_COOKIE = 'ms_auth'

// Hash both sides so the comparison is constant-time and length-blind.
export function passwordOk(given: string): boolean {
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(process.env.APP_PASSWORD ?? '').digest()
  return timingSafeEqual(a, b)
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex')
}
