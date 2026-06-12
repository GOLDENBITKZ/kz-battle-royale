const CACHE = 'kz-battle-v1'

const PRECACHE = ['/', '/login', '/manifest.json']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // Skip non-same-origin, SSE, API routes
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/') ||
    e.request.headers.get('Accept')?.includes('text/event-stream')
  ) {
    return
  }

  // Cache-first for static assets
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached ?? fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // Network-first for pages
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res })
        .catch(() => caches.match(e.request).then(r => r ?? caches.match('/')))
    )
  }
})

self.addEventListener('push', (e) => {
  const d = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(d.title ?? 'KZ Battle', {
      body:      d.body ?? 'Новые события на карте!',
      icon:      '/icon-192.png',
      badge:     '/icon-192.png',
      tag:       d.tag ?? 'kz-battle',
      renotify:  true,
      data:      { url: d.url ?? '/game' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = e.notification.data?.url ?? '/game'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes('/game'))
      if (existing) return existing.focus()
      return self.clients.openWindow(target)
    })
  )
})
