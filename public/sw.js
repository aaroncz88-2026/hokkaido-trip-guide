/* EMERGENCY RECOVERY SW
 * Clears broken caches and unregisters itself so the guide can load again.
 * Do not add caching logic here until clients recover.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      } catch {
        // ignore
      }

      try {
        await self.registration.unregister()
      } catch {
        // ignore
      }

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      await Promise.all(
        clients.map((client) => {
          const url = new URL(client.url)
          url.searchParams.set('recovered', '1')
          return client.navigate(url.toString())
        }),
      )
    })(),
  )
})

// While this SW briefly controls the page, never serve stale shells.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request, { cache: 'no-store' }))
})
