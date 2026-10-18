import { useEffect, useState } from 'react'
import type { DemoKey } from '../types'
interface Props { demo: DemoKey; size?: number | string; playing?: boolean; speed?: number; className?: string; phase?: number; highlight?: boolean }
let cache: Record<string, string> = {}
let pending: Promise<Record<string, string>> | null = null
function loadThumbnails() {
  if (!pending) pending = fetch(`${import.meta.env.BASE_URL}movement3d/thumbnails.json`).then(r => { if (!r.ok) throw new Error('Thumbnail load failed'); return r.json() }).then(data => { cache = data; return data }).catch(error => { pending = null; throw error })
  return pending
}
/** Stills rendered from the same full 3D human, keeping card lists lightweight. */
export default function ExerciseFigure({ demo, size = '100%', className = '', highlight = true }: Props) {
  const [src, setSrc] = useState(cache[demo])
  useEffect(() => { let alive = true; if (cache[demo]) setSrc(cache[demo]); else loadThumbnails().then(data => { if (alive) setSrc(data[demo]) }).catch(() => {}); return () => { alive = false } }, [demo])
  const cls = `fig figure-thumbnail ${className} ${highlight ? '' : 'muted-muscles'}`
  return src ? <img className={cls} src={src} width={216} height={220} style={{ width: size }} alt="" aria-hidden="true" loading="lazy" draggable={false} /> : <div className={cls} style={{ width: size, aspectRatio: '216 / 220' }} aria-hidden="true" />
}
