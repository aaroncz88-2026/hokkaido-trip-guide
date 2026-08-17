import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        // One-time recovery after broken SW shells (v16 and earlier).
        const recoveryKey = 'hokkaido-sw-recovery-v17'
        if (!localStorage.getItem(recoveryKey)) {
          const hadController = Boolean(navigator.serviceWorker.controller)
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((registration) => registration.unregister()))
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(
              keys
                .filter((key) => key.startsWith('hokkaido-guide'))
                .map((key) => caches.delete(key)),
            )
          }
          localStorage.setItem(recoveryKey, '1')
          if (hadController) {
            window.location.reload()
            return
          }
        }

        const registration = await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js?v=17`,
        )
        await registration.update()
      } catch {
        // ignore offline / private-mode registration failures
      }
    })()
  })
}
