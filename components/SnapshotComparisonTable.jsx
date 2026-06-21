'use client'

const NAVY = '#1B2965'

const METRICS = [
  { key: 'sessions',        label: 'Sessions',          format: 'number'  },
  { key: 'webSessions',     label: 'Traffic · Web',     format: 'number'  },
  { key: 'iosSessions',     label: 'Traffic · iOS',     format: 'number'  },
  { key: 'androidSessions', label: 'Traffic · Android', format: 'number'  },
  { key: 'conversions',     label: 'Conversions',       format: 'number'  },
  { key: 'conversionRate',  label: 'Conversion Rate',   format: 'percent' },
]

function fmtValue(value, format) {
  if (value == null || isNaN(value)) return '—'
  if (format === 'percent') return `${value.toFixed(2)}%`
  return Math.round(value).toLocaleString()
}

function ChangeCell({ current, previous, format }) {
  if (previous == null || previous === 0) return <span className="text-gray-300 text-[11px]">—</span>
  const diff = current - previous
  const pct  = (diff / previous) * 100
  const isPositive = diff > 0
  const diffStr = format === 'percent'
    ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp`
    : `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString()}`
  const color = isPositive ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'
  return (
    <div className={`text-[11px] font-medium ${color}`}>
      {diffStr}
      <span className="ml-0.5 text-gray-400 font-normal">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-10" style={{ backgroundColor: NAVY, opacity: 0.15 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="h-3 bg-gray-100 rounded w-32" />
          {Array.from({ length: 9 }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function SnapshotComparisonTable({ data, loading }) {
  if (loading) return <Skeleton />
  if (!data) return (
    <p className="text-sm text-gray-400">Could not load snapshot data.</p>
  )

  const periods = [
    { key: 'day',  label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'mtd',  label: 'Month-to-Date' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            {/* Period group headers */}
            <tr style={{ backgroundColor: NAVY }}>
              <th className="text-left px-5 py-2 text-white font-semibold uppercase tracking-wide w-36" rowSpan={2}>
                Metric
              </th>
              {periods.map(({ key, label }) => (
                <th key={key} className="text-center px-2 py-2 text-white font-semibold uppercase tracking-wide border-l border-white/20" colSpan={3}>
                  {label}
                </th>
              ))}
            </tr>
            {/* Current / Previous / Change sub-headers */}
            <tr style={{ backgroundColor: '#152050' }}>
              {periods.map(({ key }) => {
                const p = data[key]
                return (
                  <>
                    <th key={`${key}-cur`}  className="text-right px-3 py-1.5 text-white/80 font-medium border-l border-white/10 whitespace-nowrap">
                      {p?.currentLabel  || '—'}
                    </th>
                    <th key={`${key}-prev`} className="text-right px-3 py-1.5 text-white/60 font-medium whitespace-nowrap">
                      {p?.previousLabel || '—'}
                    </th>
                    <th key={`${key}-chg`}  className="text-right px-3 py-1.5 text-white/60 font-medium">
                      Change
                    </th>
                  </>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, i) => (
              <tr key={metric.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-5 py-3 text-gray-700 font-medium">{metric.label}</td>
                {periods.map(({ key }) => {
                  const p   = data[key]
                  const cur = p?.current?.[metric.key]
                  const prv = p?.previous?.[metric.key]
                  return (
                    <>
                      <td key={`${key}-cur`}  className="px-3 py-3 text-right tabular-nums text-gray-900 font-semibold border-l border-gray-100">
                        {fmtValue(cur, metric.format)}
                      </td>
                      <td key={`${key}-prev`} className="px-3 py-3 text-right tabular-nums text-gray-400">
                        {fmtValue(prv, metric.format)}
                      </td>
                      <td key={`${key}-chg`}  className="px-3 py-3 text-right">
                        <ChangeCell current={cur} previous={prv} format={metric.format} />
                      </td>
                    </>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
