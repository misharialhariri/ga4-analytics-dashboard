'use client'

import { useMemo } from 'react'

// Solid cylinder cap color, then pastel-tinted trapezoids for later stages
const STAGE_FILLS = ['#2563eb', '#a855f7', '#f97316', '#16a34a']
const STAGE_DOTS  = ['#1d4ed8', '#9333ea', '#ea580c', '#15803d']

const VIEW_W       = 1000
const VIEW_H       = 220
const CY           = VIEW_H / 2
const MAX_HALF_H   = 90
const MIN_HALF_H   = 10
const CAP_CURVE    = 22 // horizontal reach of the cylinder-cap curve on stage 1

function fmtNum(v) {
  return v == null ? '—' : v.toLocaleString()
}

function fmtPct(v) {
  return v == null ? '—' : `${Math.round(v)}%`
}

// Deterministic pseudo-random so the dot scatter doesn't reshuffle on every render
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function FunnelChart({ data }) {
  const stages = data?.stages ?? []

  const segments = useMemo(() => {
    if (!stages.length) return []
    const maxVal = Math.max(...stages.map((s) => s.value), 1)

    // Funnels should only ever narrow left-to-right visually, even if the
    // underlying event counts aren't perfectly monotonic.
    let running = maxVal
    const clamped = stages.map((s) => (running = Math.min(running, s.value)))
    const scale = (v) => MIN_HALF_H + (MAX_HALF_H - MIN_HALF_H) * (v / maxVal)
    const heights = clamped.map(scale)
    // n+1 boundary half-heights: left edge, each stage transition, then a
    // near-point at the very right edge so the last stage keeps tapering.
    const boundaries = [heights[0], ...heights.slice(1), MIN_HALF_H * 0.3]

    const n = stages.length
    const segWidth = (VIEW_W - CAP_CURVE) / n
    return stages.map((s, i) => {
      const ratio = s.value / maxVal
      return {
        ...s,
        x0: CAP_CURVE + i * segWidth,
        x1: CAP_CURVE + (i + 1) * segWidth,
        h0: boundaries[i],
        h1: boundaries[i + 1],
        fill: STAGE_FILLS[i % STAGE_FILLS.length],
        dot:  STAGE_DOTS[i % STAGE_DOTS.length],
        dotCount: Math.max(6, Math.round(14 + 40 * ratio)),
      }
    })
  }, [stages])

  if (!segments.length) return null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Conversion Funnel</h3>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Dashed separators between stages */}
        {segments.slice(1).map((s) => (
          <line key={`sep-${s.stage}`}
            x1={s.x0} x2={s.x0} y1={CY - MAX_HALF_H - 14} y2={CY + MAX_HALF_H + 14}
            stroke="#e5e7eb" strokeWidth={1.5} strokeDasharray="4 5" />
        ))}

        {/* Tapering silhouette, one path per stage */}
        {segments.map((s, i) => {
          const isFirst = i === 0
          const d = isFirst
            ? `M ${s.x0} ${CY - s.h0}
               C ${s.x0 - CAP_CURVE} ${CY - s.h0} ${s.x0 - CAP_CURVE} ${CY + s.h0} ${s.x0} ${CY + s.h0}
               L ${s.x1} ${CY + s.h1}
               L ${s.x1} ${CY - s.h1}
               Z`
            : `M ${s.x0} ${CY - s.h0}
               L ${s.x1} ${CY - s.h1}
               L ${s.x1} ${CY + s.h1}
               L ${s.x0} ${CY + s.h0}
               Z`
          return (
            <path key={s.stage} d={d} fill={s.fill} fillOpacity={isFirst ? 1 : 0.13} />
          )
        })}

        {/* Scattered dots inside each stage's shape */}
        {segments.map((s, i) => {
          const rand = mulberry32(i * 97 + 13)
          return (
            <g key={`dots-${s.stage}`}>
              {Array.from({ length: s.dotCount }).map((_, j) => {
                const t = i === 0 ? 0.22 + rand() * 0.78 : rand()
                const x = s.x0 + t * (s.x1 - s.x0)
                const localHalfH = (s.h0 + (s.h1 - s.h0) * t) * 0.82
                const y = CY + (rand() * 2 - 1) * localHalfH
                return <circle key={j} cx={x} cy={y} r={3.2} fill={s.dot} fillOpacity={i === 0 ? 0.55 : 0.85} />
              })}
            </g>
          )
        })}
      </svg>

      {/* Stage labels + stats below the funnel */}
      <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}>
        {segments.map((s) => (
          <div key={s.stage} className="text-center px-1">
            <p className="text-xs font-semibold text-gray-600 truncate">{s.stage}</p>
            <p className="text-base font-bold tabular-nums" style={{ color: s.fill }}>{fmtNum(s.value)}</p>
            <p className="text-[11px] text-gray-400 tabular-nums">
              {s.completionRate != null ? `${fmtPct(s.completionRate)} continue` : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
