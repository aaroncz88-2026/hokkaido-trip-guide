import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker registration temporarily disabled after cache white-screen incident.
// Offline can return later with a safer SW. Do not re-register until verified.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations().then((regs) =>
      Promise.all(regs.map((registration) => registration.unregister())),
    )
  })
}
