'use client'

const SACO_NAVY = '#1B2965'

function rateColor(rate) {
  if (rate >= 10) return '#ef4444' // red
  if (rate >= 5)  return '#f59e0b' // amber
  return '#22c55e'                 // green
}

export default function ClarityErrorsWidget({ data }) {
  if (!data) return null

  if (data.error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Website Errors · Microsoft Clarity</h3>
        <p className="text-xs text-gray-400">{data.error}</p>
      </div>
    )
  }

  const metrics     = data.metrics ?? []
  const scriptError = metrics.find((m) => m.key === 'scriptErrors')
  const others      = metrics.filter((m) => m.key !== 'scriptErrors')

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-1">
        <h3 className="text-sm font-semibold text-gray-700">Website Errors · Microsoft Clarity</h3>
        <span className="text-[11px] text-gray-400">
          {data.window} · {data.totalSessions.toLocaleString()} sessions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Headline: script error rate */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Error Rate</p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: rateColor(scriptError?.rate ?? 0) }}>
            {(scriptError?.rate ?? 0).toFixed(2)}%
          </p>
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {(scriptError?.sessions ?? 0).toLocaleString()} sessions with JavaScript errors
          </p>
        </div>

        {/* Friction metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {others.map((m) => (
            <div key={m.key} className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-[11px] font-medium text-gray-400 mb-1 leading-tight">{m.label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: SACO_NAVY }}>
                {m.sessions.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 tabular-nums">{m.rate.toFixed(1)}% of sessions</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-300 mt-4">
        Fixed 3-day window from Clarity's Data Export API — does not follow the dashboard date selector.
      </p>
    </div>
  )
}
