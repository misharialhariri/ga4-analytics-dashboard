'use client'

export default function KPICard({ title, value, change, format = 'number', icon }) {
  const isPositive = change > 0
  const isNegative = change < 0
  const absChange = Math.abs(change).toFixed(1)

  function formatValue(val) {
    if (format === 'percentage') return `${val.toFixed(1)}%`
    if (format === 'duration') {
      const mins = Math.floor(val / 60)
      const secs = Math.floor(val % 60)
      return `${mins}m ${secs.toString().padStart(2, '0')}s`
    }
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`
    return Math.round(val).toLocaleString()
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {icon && <span className="text-xl leading-none">{icon}</span>}
      </div>

      <p className="text-3xl font-bold text-gray-900 tabular-nums">{formatValue(value)}</p>

      <div className="flex items-center gap-1.5 text-xs">
        {isPositive && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 2l4 5H2l4-5z" />
            </svg>
            {absChange}%
          </span>
        )}
        {isNegative && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-red-500">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 10L2 5h8l-4 5z" />
            </svg>
            {absChange}%
          </span>
        )}
        {!isPositive && !isNegative && (
          <span className="font-semibold text-gray-400">–</span>
        )}
        <span className="text-gray-400">vs prev period</span>
      </div>
    </div>
  )
}
