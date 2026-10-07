import { useEffect, useState } from 'react'

let depth = 0
let lastPop = false
export const wasPop = () => lastPop

export function getPath() {
  const h = location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  if (path === getPath()) return
  lastPop = false
  if (opts.replace) history.replaceState(null, '', '#' + path)
  else {
    history.pushState(null, '', '#' + path)
    depth++
  }
  window.dispatchEvent(new Event('app:navigate'))
}

export function goBack(fallback = '/') {
  if (depth > 0) history.back()
  else navigate(fallback, { replace: true })
}

export function usePath() {
  const [path, setPath] = useState(getPath)
  useEffect(() => {
    const onPop = () => {
      depth = Math.max(0, depth - 1)
      lastPop = true
      setPath(getPath())
    }
    const on = () => setPath(getPath())
    window.addEventListener('popstate', onPop)
    window.addEventListener('app:navigate', on)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('app:navigate', on)
    }
  }, [])
  return path
}
