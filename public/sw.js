const CACHE = 'hokkaido-guide-v11'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(self.registration.scope, { cache: 'reload' }))),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return

  const url = new URL(event.request.url)
  const isHashedAsset = url.pathname.includes('/assets/')

  // Cache-first for JS/CSS so return visits open instantly even on slow networks.
  if (isHashedAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(event.request, copy))
            }
            return response
          })
          .catch(() => cached)
        return cached || fetched
      }),
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then((response) => response || caches.match(self.registration.scope)),
      ),
  )
})
