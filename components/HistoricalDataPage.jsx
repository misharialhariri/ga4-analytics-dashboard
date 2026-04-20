'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const SACO_NAVY = '#1B2965'

function fmtNum(n)      { return Math.round(n).toLocaleString() }
function fmtPct(n)      { return `${n.toFixed(2)}%` }
function fmtDuration(s) {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

const COLUMNS = [
  { key: 'label',              sortKey: 'period', header: 'Period',       fmt: (v) => v,       align: 'left'  },
  { key: 'sessions',                              header: 'Sessions',     fmt: fmtNum,          align: 'right' },
  { key: 'users',                                 header: 'Users',        fmt: fmtNum,          align: 'right' },
  { key: 'newUsers',                              header: 'New Users',    fmt: fmtNum,          align: 'right' },
  { key: 'pageViews',                             header: 'Page Views',   fmt: fmtNum,          align: 'right' },
  { key: 'bounceRate',                            header: 'Bounce Rate',  fmt: fmtPct,          align: 'right' },
  { key: 'avgSessionDuration',                    header: 'Avg. Session', fmt: fmtDuration,     align: 'right' },
  { key: 'purchases',                             header: 'Purchases',    fmt: fmtNum,          align: 'right' },
  { key: 'conversionRate',                        header: 'Conv. Rate',   fmt: fmtPct,          align: 'right' },
]

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color: SACO_NAVY }}>{value}</p>
    </div>
  )
}

export default function HistoricalDataPage({ type }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [sortKey, setSortKey] = useState('period')
  const [sortDesc, setSortDesc] = useState(true)

  const isWeekly  = type === 'weekly'
  const title     = isWeekly ? 'Historical Weekly Data' : 'Historical Monthly Data'
  const subtitle  = isWeekly ? 'Weekly aggregates from Jan 2023' : 'Monthly aggregates from Jan 2023'
  const apiUrl    = isWeekly ? '/api/analytics/weekly' : '/api/analytics/monthly'
  const otherHref = isWeekly ? '/historical/monthly' : '/historical/weekly'
  const otherLabel = isWeekly ? 'Monthly View' : 'Weekly View'
  const periodUnit = isWeekly ? 'weeks' : 'months'

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [apiUrl])

  function handleSort(col) {
    const k = col.sortKey ?? col.key
    if (sortKey === k) setSortDesc((d) => !d)
    else { setSortKey(k); setSortDesc(true) }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv)
    return sortDesc ? bv - av : av - bv
  })

  // Chart: chronological order (oldest → newest)
  const chartData = [...rows].sort((a, b) => a.period.localeCompare(b.period))

  const totalSessions  = rows.reduce((s, r) => s + r.sessions,  0)
  const totalUsers     = rows.reduce((s, r) => s + r.users,     0)
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0)
  const avgConvRate    = totalSessions > 0 ? (totalPurchases / totalSessions) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative flex items-center justify-between">

            {/* Left: back to dashboard */}
            <Link href="/"
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
              ← Dashboard
            </Link>

            {/* Center: logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src="/logo.svg" alt="SACO" style={{ height: 40, width: 'auto' }} />
            </div>

            {/* Right: toggle to other view */}
            <Link href={otherHref}
              className="text-xs font-semibold px-4 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: SACO_NAVY }}>
              {otherLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {subtitle} · {rows.length} {periodUnit}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Summary cards */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Total Sessions"  value={fmtNum(totalSessions)}  />
            <SummaryCard label="Total Users"     value={fmtNum(totalUsers)}     />
            <SummaryCard label="Total Purchases" value={fmtNum(totalPurchases)} />
            <SummaryCard label="Avg Conv. Rate"  value={fmtPct(avgConvRate)}    />
          </div>
        )}

        {/* Sessions trend chart */}
        {!loading && chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Sessions Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={SACO_NAVY} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={SACO_NAVY} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  width={52}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [fmtNum(v), 'Sessions']}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke={SACO_NAVY}
                  strokeWidth={2}
                  fill="url(#sessGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: SACO_NAVY }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400 animate-pulse">
              Loading data…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: SACO_NAVY }}>
                    {COLUMNS.map((col) => {
                      const active = (col.sortKey ?? col.key) === sortKey
                      return (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col)}
                          className={`px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide
                            cursor-pointer select-none hover:opacity-80 whitespace-nowrap
                            ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          {col.header}
                          {active && <span className="ml-1">{sortDesc ? '↓' : '↑'}</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr key={row.period} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-2.5 text-xs tabular-nums whitespace-nowrap
                            ${col.key === 'label' ? 'font-semibold text-gray-700' : 'text-gray-600'}
                            ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          {col.fmt(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
