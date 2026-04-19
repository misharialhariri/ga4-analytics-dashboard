'use client'

const SACO_NAVY = '#1B2965'

function fmtValue(value, format) {
  if (format === 'percent') return `${value.toFixed(2)}%`
  return Math.round(value).toLocaleString()
}

function ChangeCell({ current, previous, format }) {
  if (previous === 0) return <span className="text-gray-400 text-xs">—</span>
  const diff = current - previous
  const pct = ((diff) / previous) * 100
  const isPercent = format === 'percent'
  const diffStr = isPercent
    ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp`
    : `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString()}`
  const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'
  return (
    <div className={`text-xs font-medium ${color}`}>
      {diffStr}
      <span className="ml-1 text-gray-400 font-normal">
        ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
      </span>
    </div>
  )
}

export default function PeriodComparisonTable({ data }) {
  if (!data) return null
  const { currentLabel, previousLabel, rows } = data

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Period Over Period Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: SACO_NAVY }}>
              <th className="text-left px-6 py-3 text-white font-semibold text-xs uppercase tracking-wide w-1/3">
                Metric
              </th>
              <th className="text-right px-6 py-3 text-white font-semibold text-xs uppercase tracking-wide w-1/4">
                {currentLabel}
              </th>
              <th className="text-right px-6 py-3 text-white font-semibold text-xs uppercase tracking-wide w-1/4">
                {previousLabel}
              </th>
              <th className="text-right px-6 py-3 text-white font-semibold text-xs uppercase tracking-wide w-1/6">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-3 text-gray-700 font-medium text-xs">{row.label}</td>
                <td className="px-6 py-3 text-right tabular-nums text-gray-900 font-semibold text-xs">
                  {fmtValue(row.current, row.format)}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-gray-500 text-xs">
                  {fmtValue(row.previous, row.format)}
                </td>
                <td className="px-6 py-3 text-right">
                  <ChangeCell current={row.current} previous={row.previous} format={row.format} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
