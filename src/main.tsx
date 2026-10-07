import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { StoreProvider } from './lib/store'
import { unlockMedia } from './lib/cues'
import './styles.css'

registerSW({ immediate: true })

// iOS needs a user gesture before audio / speech can play
const unlock = () => {
  unlockMedia()
  window.removeEventListener('touchend', unlock)
  window.removeEventListener('click', unlock)
}
window.addEventListener('touchend', unlock, { passive: true })
window.addEventListener('click', unlock)

// pre-load voices list (Chrome loads it asynchronously)
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices()
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
