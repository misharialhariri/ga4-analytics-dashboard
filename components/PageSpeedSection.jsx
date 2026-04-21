'use client'

const NAVY = '#1B2965'

// ── Score colour thresholds (0-100) ───────────────────────────────────────────
function scoreColor(score) {
  if (score == null) return '#d1d5db'
  if (score >= 90) return '#22c55e'
  if (score >= 50) return '#f97316'
  return '#ef4444'
}

// ── Field-data category colour ─────────────────────────────────────────────────
function categoryColor(cat) {
  if (cat === 'FAST')    return '#22c55e'
  if (cat === 'AVERAGE') return '#f97316'
  if (cat === 'SLOW')    return '#ef4444'
  return '#d1d5db'
}

// ── Lab metric colour (audit score 0–1) ───────────────────────────────────────
function labColor(s) {
  if (s == null) return '#9ca3af'
  if (s >= 0.9)  return '#22c55e'
  if (s >= 0.5)  return '#f97316'
  return '#ef4444'
}

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }) {
  const color  = scoreColor(score)
  const r      = 28
  const circ   = 2 * Math.PI * r
  const offset = score != null ? circ - (score / 100) * circ : circ
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="flex-shrink-0">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#f3f4f6" strokeWidth={7} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={36} y={40} textAnchor="middle"
        fontSize={16} fontWeight={700}
        fill={color} fontFamily="inherit"
      >
        {score ?? '—'}
      </text>
    </svg>
  )
}

// ── Single lab metric row ─────────────────────────────────────────────────────
function LabRow({ label, value, score }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: labColor(score) }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

// ── Field data badge ─────────────────────────────────────────────────────────
function FieldBadge({ label, value, unit, category }) {
  const color = categoryColor(category)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {value != null ? `${value}${unit ?? ''}` : '—'}
      </span>
      {category && (
        <span className="text-[9px] font-semibold uppercase" style={{ color }}>
          {category === 'FAST' ? 'Good' : category === 'AVERAGE' ? 'Needs work' : 'Poor'}
        </span>
      )}
    </div>
  )
}

// ── Strategy card (mobile or desktop) ────────────────────────────────────────
function StrategyCard({ label, icon, data }) {
  if (!data) return null
  if (data.error) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{icon}</span>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-sm text-red-400">Data unavailable</p>
        <p className="text-xs text-gray-300 mt-0.5 truncate" title={data.error}>{data.error}</p>
      </div>
    )
  }

  const { score, lab, field } = data
  const hasField = field && Object.values(field).some(Boolean)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>

      {/* Score + lab metrics */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <ScoreCircle score={score} />
          <span className="text-[10px] text-gray-400">Performance</span>
        </div>
        <div className="flex-1 min-w-0">
          <LabRow label="LCP"          value={lab?.lcp} score={lab?.lcpScore} />
          <LabRow label="FCP"          value={lab?.fcp} score={lab?.fcpScore} />
          <LabRow label="TBT"          value={lab?.tbt} score={lab?.tbtScore} />
          <LabRow label="CLS"          value={lab?.cls} score={lab?.clsScore} />
          <LabRow label="Speed Index"  value={lab?.si}  score={lab?.siScore}  />
        </div>
      </div>

      {/* Field data (real-user CWV) */}
      {hasField && (
        <>
          <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mt-4 mb-2">
            Real-user data (75th percentile)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {field.lcp  && <FieldBadge label="LCP"  value={field.lcp.value}  unit="s"  category={field.lcp.category}  />}
            {field.cls  && <FieldBadge label="CLS"  value={field.cls.value}       category={field.cls.category}  />}
            {field.inp  && <FieldBadge label="INP"  value={field.inp.value}  unit="ms" category={field.inp.category}  />}
            {field.fcp  && <FieldBadge label="FCP"  value={field.fcp.value}  unit="s"  category={field.fcp.category}  />}
            {field.ttfb && <FieldBadge label="TTFB" value={field.ttfb.value} unit="ms" category={field.ttfb.category} />}
          </div>
        </>
      )}
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="flex items-start gap-4">
        <div className="w-[72px] h-[72px] bg-gray-100 rounded-full" />
        <div className="flex-1 space-y-2.5 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PageSpeedSection({ data, loading }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs text-gray-400">
          saco.sa &middot; scores from Google Lighthouse &middot; refreshes hourly
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <><Skeleton /><Skeleton /></>
        ) : !data ? (
          <p className="text-sm text-gray-400 col-span-2">
            Could not load PageSpeed data — check server logs.
          </p>
        ) : (
          <>
            <StrategyCard label="Mobile"  icon="📱" data={data.mobile}  />
            <StrategyCard label="Desktop" icon="🖥️" data={data.desktop} />
          </>
        )}
      </div>
    </div>
  )
}
