import { useMemo, useState } from "react"
import { compactUzs, uzs } from "./store-ui"

/**
 * Small dependency-free SVG charts in the dashboard's style.
 * Lines are smoothed with a monotone cubic so they never overshoot below 0.
 */

const BLUE = "#3B82F6"
const PINK = "#F472B6"

type Pt = [number, number]

// Monotone cubic interpolation (Fritsch–Carlson) → SVG path
function smoothPath(points: Pt[]) {
  if (points.length < 2) return ""
  const n = points.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    m[i] = (points[i + 1][1] - points[i][1]) / dx[i]
  }
  const t: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  t[n - 1] = m[n - 2]
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0
      continue
    }
    const a = t[i] / m[i]
    const b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      t[i] = k * a * m[i]
      t[i + 1] = k * b * m[i]
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`
  }
  return d
}

const niceMax = (v: number) => {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const r = v / p
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * p
}

export function RevenueChart({
  months,
}: {
  months: { month: string; online: number; in_store: number }[]
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 560
  const H = 240
  const pad = { l: 44, r: 8, t: 12, b: 26 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const max = niceMax(Math.max(1, ...months.map((m) => Math.max(m.online, m.in_store))))
  const x = (i: number) => pad.l + (iw * i) / Math.max(1, months.length - 1)
  const y = (v: number) => pad.t + ih - (v / max) * ih

  const lines = useMemo(
    () => ({
      online: smoothPath(months.map((m, i) => [x(i), y(m.online)])),
      in_store: smoothPath(months.map((m, i) => [x(i), y(m.in_store)])),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [months, max]
  )
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const label = (key: string) =>
    new Date(`${key}-01T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" })

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - pad.l) / iw) * (months.length - 1))
    setHover(Math.min(months.length - 1, Math.max(0, i)))
  }

  const h = hover !== null ? months[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Revenue by month, online and in-store"
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#6B6B73">
              {compactUzs(v)}
            </text>
          </g>
        ))}
        {months.map((m, i) => (
          <text key={m.month} x={x(i)} y={H - 6} textAnchor="middle" fontSize="12" fill={hover === i ? "#fff" : "#6B6B73"}>
            {label(m.month)}
          </text>
        ))}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgba(255,255,255,0.12)" />
        )}
        <path d={lines.in_store} fill="none" stroke={PINK} strokeWidth="2.25" strokeLinecap="round" />
        <path d={lines.online} fill="none" stroke={BLUE} strokeWidth="2.25" strokeLinecap="round" />
        {h && (
          <>
            <circle cx={x(hover!)} cy={y(h.in_store)} r="4" fill={PINK} stroke="#17171A" strokeWidth="2" />
            <circle cx={x(hover!)} cy={y(h.online)} r="4" fill={BLUE} stroke="#17171A" strokeWidth="2" />
          </>
        )}
      </svg>

      {h && (
        <div
          className="pointer-events-none absolute top-2 rounded-2xl border border-white/10 bg-[#222226] px-3 py-2 text-[12px] shadow-lg"
          style={{
            left: `${(x(hover!) / W) * 100}%`,
            transform: `translateX(${hover! > months.length / 2 ? "calc(-100% - 12px)" : "12px"})`,
          }}
        >
          <p className="mb-1 text-[#8E8E96]">{label(h.month)}</p>
          <p className="flex items-center gap-2 tabular-nums text-white">
            <span className="h-2 w-2 rounded-full" style={{ background: BLUE }} /> {uzs(h.online)}
          </p>
          <p className="flex items-center gap-2 tabular-nums text-white">
            <span className="h-2 w-2 rounded-full" style={{ background: PINK }} /> {uzs(h.in_store)}
          </p>
        </div>
      )}
    </div>
  )
}

export function WeekBars({
  week,
}: {
  week: { date: string; orders: number; revenue: number; is_today: boolean }[]
}) {
  const max = Math.max(1, ...week.map((d) => d.orders))
  const total = week.reduce((a, d) => a + d.orders, 0)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="flex h-full items-end gap-2.5">
      {week.map((d, i) => {
        const pct = d.orders / max
        const share = total ? Math.round((d.orders / total) * 100) : 0
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2" title={`${d.orders} orders · ${uzs(d.revenue)}`}>
            <div
              className="relative h-[180px] w-full overflow-hidden rounded-full"
              style={{
                background:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 7px), #1E1E22",
              }}
            >
              {d.orders > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 flex items-start justify-center rounded-full pt-2 transition-[height] duration-500"
                  style={{
                    height: `${Math.max(14, pct * 100)}%`,
                    background: d.is_today ? "#2563EB" : "#5B9BFF",
                  }}
                >
                  {d.is_today && <span className="text-[11px] font-medium text-white">{share}%</span>}
                </div>
              )}
            </div>
            <span className={`text-[12px] ${d.is_today ? "text-white" : "text-[#8E8E96]"}`}>{days[i]}</span>
          </div>
        )
      })}
    </div>
  )
}
