const CACHE = 'ms-shell-v1'
const SHELL = ['/', '/login', '/history']

// App shell cache: pages by pathname, static chunks by URL, served first and refreshed behind.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(SHELL.map((p) => fetch(p).then((r) => r.ok && !r.redirected && cache.put(p, r)).catch(() => {})))
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  const nav = request.mode === 'navigate'
  if (request.method !== 'GET' || url.origin !== location.origin) return
  if (!nav && !url.pathname.startsWith('/_next/static/')) return
  const key = nav ? url.pathname : request
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(key)
      const fresh = fetch(request)
        .then((r) => {
          if (r.ok && !r.redirected) cache.put(key, r.clone())
          return r
        })
        .catch(() => hit)
      event.waitUntil(fresh)
      return hit ?? fresh
    })
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'my-signal', body: 'Still there?' }
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png', badge: '/icon-192.png' })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/'))
})
