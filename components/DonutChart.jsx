'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PALETTE = [
  '#1B2965', '#2D4499', '#4A6BC0', '#06b6d4',
  '#f59e0b', '#10b981', '#f43f5e', '#ec4899',
]

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RAD = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RAD)
  const y = cy + r * Math.sin(-midAngle * RAD)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.sessions, 0)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Traffic Sources</h3>
        <span className="text-xs text-gray-400">
          {total.toLocaleString()} sessions
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={62}
            outerRadius={100}
            dataKey="sessions"
            nameKey="source"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [v.toLocaleString(), 'Sessions']}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
