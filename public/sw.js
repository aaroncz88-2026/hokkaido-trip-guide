const CACHE = 'hokkaido-guide-v17'

self.addEventListener('install', () => {
  // Do not precache the HTML shell — a stale shell + purged assets white-screens the app.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('hokkaido-guide-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return

  // Navigations: network only (with soft offline fallback). Never serve a mismatched shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(async () => {
        const cached = (await caches.match(event.request)) || (await caches.match('./'))
        return cached || Response.error()
      }),
    )
    return
  }

  const url = new URL(event.request.url)
  const isHashedAsset = url.pathname.includes('/assets/')
  if (!isHashedAsset) return

  // Hashed JS/CSS: cache-first for snappy reloads.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone())
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
