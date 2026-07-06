'use client'

// Navy → lighter navy, one shade per funnel stage
const STAGE_COLORS = ['#1B2965', '#3A4A8C', '#5E6DAE', '#8893C9']

function fmtNum(v) {
  return v == null ? '—' : v.toLocaleString()
}

function fmtPct(v) {
  return v == null ? '—' : `${Math.round(v)}%`
}

export default function FunnelChart({ data }) {
  const stages = data?.stages ?? []
  if (!stages.length) return null

  const max = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Conversion Funnel</h3>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[130px_1fr_90px_110px_90px] gap-3 mb-2 px-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Stage</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Active Users</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Completion</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Abandonments</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Abandon. Rate</span>
      </div>

      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const widthPct = Math.max((s.value / max) * 100, 2)
          const isLast = i === stages.length - 1
          return (
            <div key={s.stage}>
              <div className="grid grid-cols-2 sm:grid-cols-[130px_1fr_90px_110px_90px] gap-x-3 gap-y-1 items-center px-1">
                {/* Stage label */}
                <span className="text-xs font-semibold text-gray-600">{s.stage}</span>

                {/* Bar + value */}
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2 order-last sm:order-none">
                  <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${widthPct}%`, backgroundColor: STAGE_COLORS[i] ?? STAGE_COLORS.at(-1) }}
                    >
                      {widthPct > 18 && (
                        <span className="text-[11px] font-semibold text-white tabular-nums whitespace-nowrap">
                          {fmtNum(s.value)}
                        </span>
                      )}
                    </div>
                  </div>
                  {widthPct <= 18 && (
                    <span className="text-[11px] font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                      {fmtNum(s.value)}
                    </span>
                  )}
                </div>

                {/* Completion rate (into next stage) */}
                <span className={`text-xs font-semibold tabular-nums text-right ${
                  s.completionRate == null ? 'text-gray-300' : 'text-emerald-600'
                }`}>
                  {fmtPct(s.completionRate)}
                </span>

                {/* Abandonments */}
                <span className={`text-xs tabular-nums text-right hidden sm:block ${
                  s.abandonments == null ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {fmtNum(s.abandonments)}
                </span>

                {/* Abandonment rate */}
                <span className={`text-xs font-semibold tabular-nums text-right hidden sm:block ${
                  s.abandonmentRate == null ? 'text-gray-300' : 'text-red-500'
                }`}>
                  {fmtPct(s.abandonmentRate)}
                </span>
              </div>

              {/* Connector arrow between stages */}
              {!isLast && (
                <div className="pl-[130px] hidden sm:flex items-center gap-1.5 py-0.5 ml-1">
                  <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-[10px] text-gray-400 tabular-nums">
                    {fmtPct(s.completionRate)} continue · {fmtNum(s.abandonments)} drop off
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
