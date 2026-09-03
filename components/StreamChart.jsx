'use client'

import { useState } from 'react'
import {
  BarChart as RechartsBar,
  Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import ViewToggle from './ViewToggle'
import DataTable  from './DataTable'

function truncate(str, n = 30) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

const COLUMNS = [
  { key: 'stream',   label: 'Stream' },
  { key: 'sessions', label: 'Sessions', align: 'right', render: (r) => r.sessions.toLocaleString() },
  { key: 'users',    label: 'Users',    align: 'right', render: (r) => r.users.toLocaleString() },
]

export default function StreamChart({ data }) {
  const [view, setView] = useState('chart')
  const formatted = data.map((d) => ({ ...d, label: truncate(d.stream) }))

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5 gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Traffic by Stream</h3>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {formatted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No stream data available for this period
        </div>
      ) : view === 'table' ? (
        <DataTable columns={COLUMNS} rows={data} height={280} />
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
            <Bar dataKey="sessions" name="Sessions" fill="#1B2965"
              radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="users" name="Users" fill="#06b6d4"
              radius={[0, 4, 4, 0]} maxBarSize={14} />
          </RechartsBar>
        </ResponsiveContainer>
      )}
    </div>
  )
}
