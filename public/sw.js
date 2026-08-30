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
