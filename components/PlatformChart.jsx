'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PLATFORM_CONFIG = {
  iOS:     { color: '#1c1c1e', icon: '🍎' },
  Android: { color: '#3ddc84', icon: '🤖' },
  Web:     { color: '#1B2965', icon: '🌐' },
  Other:   { color: '#9ca3af', icon: '📱' },
}

function getConfig(platform) {
  return PLATFORM_CONFIG[platform] || { color: '#94a3b8', icon: '📱' }
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RAD = Math.PI / 180
  const r   = innerRadius + (outerRadius - innerRadius) * 0.55
  const x   = cx + r * Math.cos(-midAngle * RAD)
  const y   = cy + r * Math.sin(-midAngle * RAD)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PlatformChart({ data }) {
  const total = data.reduce((s, d) => s + d.sessions, 0)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Traffic by Platform</h3>
        <span className="text-xs text-gray-400">{total.toLocaleString()} sessions</span>
      </div>

      {/* Platform pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {data.map((d) => {
          const cfg = getConfig(d.platform)
          return (
            <div key={d.platform}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <span className="text-base leading-none">{cfg.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{d.platform}</span>
              <span className="text-xs text-gray-400">
                {total > 0 ? ((d.sessions / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={90}
            dataKey="sessions" nameKey="platform"
            labelLine={false} label={renderLabel}
          >
            {data.map((d) => (
              <Cell key={d.platform} fill={getConfig(d.platform).color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [v.toLocaleString(), 'Sessions']}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
