'use client'

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

function truncate(str, n = 32) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export default function BarChart({ data }) {
  const formatted = data.map((d) => ({ ...d, label: truncate(d.page) }))

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Top Pages by Views</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RechartsBar
          data={formatted}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip
            formatter={(value, name) => [value.toLocaleString(), name === 'pageviews' ? 'Page Views' : 'Sessions']}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="pageviews" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#1B2965' : `hsl(${220 + i * 6}, 55%, ${35 + i * 4}%)`} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  )
}
