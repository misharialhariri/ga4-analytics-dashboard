'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ViewToggle   from './ViewToggle'
import MetricToggle from './MetricToggle'
import DataTable    from './DataTable'

const PALETTE = [
  '#1B2965', '#2D4499', '#4A6BC0', '#06b6d4',
  '#f59e0b', '#10b981', '#f43f5e', '#ec4899',
]

const SCOPES = [
  { key: 'combined', label: 'Combined' },
  { key: 'website',  label: 'Website'  },
  { key: 'mobile',   label: 'Mobile'   },
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

// Maps a scope key + metric to the underlying data field, e.g.
// scope 'website', metric 'users' -> 'websiteUsers'; scope 'combined',
// metric 'sessions' -> 'combined'.
function fieldFor(scopeKey, metric) {
  if (metric === 'sessions') return scopeKey
  return scopeKey === 'combined' ? 'combinedUsers' : `${scopeKey}Users`
}

export default function DonutChart({ data }) {
  const [view, setView]     = useState('chart')
  const [scope, setScope]   = useState('combined')
  const [metric, setMetric] = useState('sessions')
  const metricLabel = metric === 'sessions' ? 'Sessions' : 'Active Users'

  const valueField = fieldFor(scope, metric)
  const chartData  = data.map((d) => ({ ...d, value: d[valueField] }))
  const total = chartData.reduce((s, d) => s + d.value, 0)

  const tableColumns = [
    { key: 'source',  label: 'Source' },
    { key: 'website', label: 'Website',  align: 'right', render: (r) => r[fieldFor('website', metric)].toLocaleString() },
    { key: 'mobile',  label: 'Mobile',   align: 'right', render: (r) => r[fieldFor('mobile', metric)].toLocaleString() },
    { key: 'combined',label: 'Combined', align: 'right', render: (r) => r[fieldFor('combined', metric)].toLocaleString() },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-700">Traffic Sources</h3>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {view === 'chart' ? `${total.toLocaleString()} ${metricLabel.toLowerCase()}` : `${data.length} sources`}
          </span>
          <MetricToggle metric={metric} onChange={setMetric} />
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === 'chart' && (
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            {SCOPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  scope === key ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'table' ? (
        <DataTable columns={tableColumns} rows={data} height={280} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={62}
              outerRadius={100}
              dataKey="value"
              nameKey="source"
              labelLine={false}
              label={renderLabel}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [v.toLocaleString(), metricLabel]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
