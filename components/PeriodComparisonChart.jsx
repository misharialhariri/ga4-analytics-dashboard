'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const NAVY = '#1B2965'
const TEAL = '#6EC6CA'

function fmtNum(n) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function ChartCard({ title, chartData, currentLabel, previousLabel, yAxisFormatter }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={yAxisFormatter || fmtNum}
            width={44}
          />
          <Tooltip
            formatter={(val, key) => [
              yAxisFormatter ? `${val.toFixed(2)}%` : val.toLocaleString(),
              key === 'current' ? currentLabel : previousLabel,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="current"  name="current"  fill={NAVY} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="previous" name="previous" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: NAVY }} />
          {currentLabel}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: TEAL }} />
          {previousLabel}
        </span>
      </div>
    </div>
  )
}

const TRAFFIC_LABELS          = ['Users', 'Sessions', 'New Users', 'Search Results']
const CONVERSION_LABELS       = ['Total Conversions', 'Conversion (Website)', 'Conversion (App)']
const CONVERSION_RATE_LABELS  = ['Total Conversion Rate', 'Conversion Rate (Website)', 'Conversion Rate (App)']
const OTHER_RATE_LABELS       = ['Bounce Rate', 'Carts Abandonment Rate']

const SHORT_NAMES = {
  'Users': 'Users',
  'Sessions': 'Sessions',
  'New Users': 'New Users',
  'Search Results': 'Search',
  'Total Conversions': 'Total Conv.',
  'Conversion (Website)': 'Web Conv.',
  'Conversion (App)': 'App Conv.',
  'Total Conversion Rate': 'Total CR',
  'Conversion Rate (Website)': 'Web CR',
  'Conversion Rate (App)': 'App CR',
  'Bounce Rate': 'Bounce',
  'Carts Abandonment Rate': 'Cart Aband.',
}

export default function PeriodComparisonChart({ data }) {
  if (!data) return null

  const { rows, currentLabel, previousLabel } = data

  function toChartData(labels) {
    return labels.map((lbl) => {
      const row = rows.find((r) => r.label === lbl)
      if (!row) return null
      return {
        name:     SHORT_NAMES[lbl] ?? lbl,
        current:  row.format === 'percent' ? parseFloat(row.current.toFixed(2))  : Math.round(row.current),
        previous: row.format === 'percent' ? parseFloat(row.previous.toFixed(2)) : Math.round(row.previous),
      }
    }).filter(Boolean)
  }

  const pct = (v) => `${v}%`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Traffic — current vs previous"
          chartData={toChartData(TRAFFIC_LABELS)}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
        />
        <ChartCard
          title="Conversions — current vs previous"
          chartData={toChartData(CONVERSION_LABELS)}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Conversion Rates (%) — current vs previous"
          chartData={toChartData(CONVERSION_RATE_LABELS)}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          yAxisFormatter={pct}
        />
        <ChartCard
          title="Bounce & Cart Abandonment Rate (%) — current vs previous"
          chartData={toChartData(OTHER_RATE_LABELS)}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          yAxisFormatter={pct}
        />
      </div>
    </div>
  )
}
