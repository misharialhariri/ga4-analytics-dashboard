'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import ViewToggle from './ViewToggle'
import DataTable  from './DataTable'

const GENDER_COLORS = {
  male:    '#1B2965',
  female:  '#ec4899',
  unknown: '#9ca3af',
}

const AGE_PALETTE = [
  '#1B2965', '#2D4499', '#4A6BC0',
  '#06b6d4', '#22d3ee', '#67e8f9',
]

function NoData({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-1 text-center">
      <p className="text-sm text-gray-400">{message}</p>
      <p className="text-xs text-gray-300">Enable Google Signals in GA4 Admin → Data Settings</p>
    </div>
  )
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

const GENDER_COLUMNS = [
  { key: 'gender', label: 'Gender', render: (r) => capitalize(r.gender) },
  { key: 'users',  label: 'Users',  align: 'right', render: (r) => r.users.toLocaleString() },
]

const AGE_COLUMNS = [
  { key: 'age',   label: 'Age Group' },
  { key: 'users', label: 'Users', align: 'right', render: (r) => r.users.toLocaleString() },
]

export default function GenderAgeChart({ genderData, ageData }) {
  const [view, setView] = useState('chart')
  const hasGender = genderData.length > 0
  const hasAge    = ageData.length > 0

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5 gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Demographics</h3>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* ── Gender ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Active Users by Gender
          </p>
          {!hasGender ? (
            <NoData message="No gender data available" />
          ) : view === 'table' ? (
            <DataTable columns={GENDER_COLUMNS} rows={genderData} height={180} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={genderData.map((d) => ({ ...d, label: capitalize(d.gender) }))}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  width={36}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={(v) => [v.toLocaleString(), 'Users']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Bar dataKey="users" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {genderData.map((d, i) => (
                    <Cell key={i} fill={GENDER_COLORS[d.gender] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Age ────────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Active Users by Age Group
          </p>
          {!hasAge ? (
            <NoData message="No age data available" />
          ) : view === 'table' ? (
            <DataTable columns={AGE_COLUMNS} rows={ageData} height={180} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={ageData}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  width={36}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={(v) => [v.toLocaleString(), 'Users']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Bar dataKey="users" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {ageData.map((_, i) => (
                    <Cell key={i} fill={AGE_PALETTE[i % AGE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  )
}
