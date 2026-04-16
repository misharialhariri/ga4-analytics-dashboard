'use client'

import {
  BarChart as RechartsBar,
  Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const SOURCE_COLORS = {
  'Google':    '#4285F4',
  'Instagram': '#E1306C',
  'TikTok':    '#69C9D0',
  'Facebook':  '#1877F2',
  'Snapchat':  '#F7C008',
  'Twitter/X': '#1DA1F2',
  'YouTube':   '#FF0000',
  'LinkedIn':  '#0A66C2',
  'Direct':    '#1B2965',
}

function getColor(source) {
  return SOURCE_COLORS[source] || '#94a3b8'
}

export default function SocialSourceChart({ data }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Sessions by Source</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RechartsBar
          data={data}
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
            type="category" dataKey="source"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false} tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(v) => [v.toLocaleString(), 'Sessions']}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="sessions" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((d, i) => (
              <Cell key={i} fill={getColor(d.source)} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  )
}
