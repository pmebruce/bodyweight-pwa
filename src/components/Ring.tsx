import type { ReactNode } from 'react'

export default function Ring({ progress, size = 260, stroke = 14, children, colors = ['var(--accent)', 'var(--accent2)'], id = 'ring' }: { progress: number; size?: number; stroke?: number; children?: ReactNode; colors?: [string, string]; id?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: colors[0] }} />
            <stop offset="1" style={{ stopColor: colors[1] }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 10px ${colors[1]})` }}
        />
        {p > 0.002 && (
          <circle
            cx={size / 2 + r * Math.cos(2 * Math.PI * p - Math.PI / 2)}
            cy={size / 2 + r * Math.sin(2 * Math.PI * p - Math.PI / 2)}
            r={stroke / 2 + 2}
            fill="#fff"
          />
        )}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
