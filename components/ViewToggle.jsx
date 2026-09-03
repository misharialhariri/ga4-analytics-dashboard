'use client'

export default function ViewToggle({ view, onChange, className = '' }) {
  return (
    <div className={`flex items-center bg-gray-100 rounded-full p-0.5 flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => onChange('chart')}
        title="Chart view"
        aria-pressed={view === 'chart'}
        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
          view === 'chart' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V10m6 9V5m6 14v-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        title="Table view"
        aria-pressed={view === 'table'}
        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
          view === 'table' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
          <path strokeLinecap="round" d="M3.5 9.5h17M9 9.5V19.5" />
        </svg>
      </button>
    </div>
  )
}
