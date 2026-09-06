'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ViewToggle   from './ViewToggle'
import MetricToggle from './MetricToggle'
import DataTable    from './DataTable'

const DEVICE_CONFIG = {
  desktop:  { color: '#1B2965', icon: '💻', label: 'Desktop'  },
  mobile:   { color: '#06b6d4', icon: '📱', label: 'Mobile'   },
  tablet:   { color: '#f59e0b', icon: '📋', label: 'Tablet'   },
  smart_tv: { color: '#a855f7', icon: '📺', label: 'Smart TV' },
}

function getConfig(device) {
  const key = (device || '').toLowerCase().replace(/\s+/g, '_')
  return DEVICE_CONFIG[key] || { color: '#94a3b8', icon: '📶', label: device || 'Other' }
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

export default function DeviceChart({ data }) {
  const [view, setView]     = useState('chart')
  const [metric, setMetric] = useState('sessions')
  const metricLabel = metric === 'sessions' ? 'Sessions' : 'Active Users'
  const total = data.reduce((s, d) => s + d[metric], 0)

  const columns = [
    { key: 'device', label: 'Device', render: (r) => getConfig(r.device).label },
    { key: metric,   label: metricLabel, align: 'right', render: (r) => r[metric].toLocaleString() },
    {
      key: 'share', label: '% of Total', align: 'right',
      render: (r) => `${total > 0 ? ((r[metric] / total) * 100).toFixed(1) : 0}%`,
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-700">Traffic by Device</h3>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs text-gray-400 whitespace-nowrap">{total.toLocaleString()} {metricLabel.toLowerCase()}</span>
          <MetricToggle metric={metric} onChange={setMetric} />
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Device pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {data.map((d) => {
          const cfg = getConfig(d.device)
          return (
            <div key={d.device}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <span className="text-base leading-none">{cfg.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
              <span className="text-xs text-gray-400">
                {total > 0 ? ((d[metric] / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          )
        })}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No device data available for this period
        </div>
      ) : view === 'table' ? (
        <DataTable columns={columns} rows={data} height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={55} outerRadius={90}
              dataKey={metric} nameKey="device"
              labelLine={false} label={renderLabel}
            >
              {data.map((d) => (
                <Cell key={d.device} fill={getConfig(d.device).color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n, entry) => [v.toLocaleString(), metricLabel]}
              labelFormatter={(label) => getConfig(label).label}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => getConfig(value).label}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
