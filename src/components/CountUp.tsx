import { animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

export default function CountUp({ value, duration = 1.2, delay = 0, format = (n: number) => String(Math.round(n)) }: { value: number; duration?: number; delay?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const c = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <span ref={ref}>{format(0)}</span>
}
