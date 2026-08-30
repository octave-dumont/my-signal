export const AUTH_COOKIE = 'ms_auth'

// Web Crypto so the same code runs in proxy (edge) and route handlers (node).
export async function authToken(): Promise<string> {
  const data = new TextEncoder().encode(`my-signal:${process.env.APP_PASSWORD}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
}
