'use client'

const METRICS = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'users',    label: 'Active Users' },
]

export default function MetricToggle({ metric, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 bg-gray-100 rounded-full p-0.5 flex-shrink-0 ${className}`}>
      {METRICS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
            metric === key ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
