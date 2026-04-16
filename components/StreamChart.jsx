'use client'

import {
  BarChart as RechartsBar,
  Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function truncate(str, n = 30) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export default function StreamChart({ data }) {
  const formatted = data.map((d) => ({ ...d, label: truncate(d.stream) }))

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Traffic by Stream</h3>

      {formatted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No stream data available for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <RechartsBar
            data={formatted}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <YAxis
              type="category" dataKey="label"
              tick={{ fontSize: 10, fill: '#374151' }}
              axisLine={false} tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sessions" name="Sessions" fill="#6366f1"
              radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="users" name="Users" fill="#06b6d4"
              radius={[0, 4, 4, 0]} maxBarSize={14} />
          </RechartsBar>
        </ResponsiveContainer>
      )}
    </div>
  )
}
