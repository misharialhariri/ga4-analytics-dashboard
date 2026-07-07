'use client'

import { useState } from 'react'
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const METRICS = [
  { key: 'sessions',        label: 'Sessions',              color: '#1B2965', axis: 'count'   },
  { key: 'users',           label: 'Users',                 color: '#06b6d4', axis: 'count'   },
  { key: 'newUsers',        label: 'New Users',             color: '#f97316', axis: 'count'   },
  { key: 'conversions',     label: 'Total Conversions',     color: '#22c55e', axis: 'count'   },
  { key: 'webSessions',     label: 'Traffic · Web',         color: '#3b82f6', axis: 'count'   },
  { key: 'iosSessions',     label: 'Traffic · iOS',         color: '#d946ef', axis: 'count'   },
  { key: 'androidSessions', label: 'Traffic · Android',     color: '#f59e0b', axis: 'count'   },
  { key: 'webConversions',  label: 'Conversion · Web',      color: '#10b981', axis: 'count'   },
  { key: 'appConversions',  label: 'Conversion · App',      color: '#6366f1', axis: 'count'   },
  { key: 'searchResults',   label: 'Search Results',        color: '#a78bfa', axis: 'count'   },
  { key: 'abandoned',       label: 'Cart Abandonment',      color: '#fb923c', axis: 'count'   },
  { key: 'bounceRate',      label: 'Bounce Rate',           color: '#ef4444', axis: 'percent' },
  { key: 'conversionRate',  label: 'Total Conv. Rate',      color: '#8b5cf6', axis: 'percent' },
  { key: 'webConvRate',     label: 'Conv. Rate · Web',      color: '#ec4899', axis: 'percent' },
  { key: 'appConvRate',     label: 'Conv. Rate · App',      color: '#14b8a6', axis: 'percent' },
  { key: 'abandonedRate',   label: 'Cart Abandon. Rate',    color: '#f43f5e', axis: 'percent' },
]

const METRIC_MAP = Object.fromEntries(METRICS.map((m) => [m.key, m]))

function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw
  const d = new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtCount(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return v
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2">{formatDate(label)}</p>
      {payload.map((entry) => {
        const m = METRIC_MAP[entry.dataKey]
        const val = m?.axis === 'percent'
          ? `${Number(entry.value).toFixed(2)}%`
          : Number(entry.value).toLocaleString()
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 flex-1">{m?.label ?? entry.dataKey}</span>
            <span className="font-semibold text-gray-800 tabular-nums">{val}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function LineChart({ data }) {
  const [selected, setSelected] = useState(['sessions', 'users'])

  function toggle(key) {
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((k) => k !== key) : prev
      }
      return [...prev, key]
    })
  }

  const selectedMetrics = METRICS.filter((m) => selected.includes(m.key))
  const countMetrics    = selectedMetrics.filter((m) => m.axis === 'count')
  const percentMetrics  = selectedMetrics.filter((m) => m.axis === 'percent')

  // When selected count metrics differ hugely in magnitude (e.g. Cart
  // Abandonment ~5k vs Total Conversions ~200), the smaller ones flatten into
  // a line at the bottom. Any count metric peaking below 1/10 of the largest
  // gets its own secondary axis so both stay readable.
  const SPLIT_RATIO = 10
  const maxByKey = {}
  countMetrics.forEach((m) => {
    maxByKey[m.key] = Math.max(0, ...(data ?? []).map((d) => d[m.key] ?? 0))
  })
  const countGlobalMax = Math.max(0, ...countMetrics.map((m) => maxByKey[m.key]))
  const smallKeys = new Set(
    countMetrics.length > 1 && countGlobalMax > 0
      ? countMetrics
          .filter((m) => maxByKey[m.key] < countGlobalMax / SPLIT_RATIO)
          .map((m) => m.key)
      : []
  )

  const hasCount   = countMetrics.some((m) => !smallKeys.has(m.key))
  const hasSmall   = smallKeys.size > 0
  const hasPercent = percentMetrics.length > 0

  function axisFor(m) {
    if (m.axis === 'percent') return 'percent'
    return smallKeys.has(m.key) ? 'countSmall' : 'count'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Traffic &amp; Metrics Over Time</h3>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {METRICS.map(({ key, label, color }) => {
          const on = selected.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                on
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-700'
              }`}
              style={on ? { backgroundColor: color } : {}}
            >
              {label}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsLine data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          {(hasCount || !hasSmall) && (
            <YAxis
              yAxisId="count"
              orientation="left"
              tick={{ fontSize: 11, fill: hasCount ? '#9ca3af' : 'transparent' }}
              axisLine={false}
              tickLine={false}
              width={hasCount ? 42 : 0}
              tickFormatter={fmtCount}
            />
          )}
          {hasSmall && (
            <YAxis
              yAxisId="countSmall"
              orientation={hasPercent ? 'left' : 'right'}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={fmtCount}
            />
          )}
          {hasPercent && (
            <YAxis
              yAxisId="percent"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={46}
              domain={[0, 'auto']}
              tickFormatter={(v) => `${parseFloat(Number(v).toFixed(2))}%`}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {selectedMetrics.map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              stroke={m.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              yAxisId={axisFor(m)}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}
