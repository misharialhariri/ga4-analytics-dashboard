'use client'

import { useState, useEffect, useCallback } from 'react'
import KPICard              from '@/components/KPICard'
import LineChart            from '@/components/LineChart'
import BarChart             from '@/components/BarChart'
import DonutChart           from '@/components/DonutChart'
import PlatformChart        from '@/components/PlatformChart'
import SocialSourceChart    from '@/components/SocialSourceChart'
import StreamChart          from '@/components/StreamChart'
import AbandonedCartsWidget from '@/components/AbandonedCartsWidget'
import GenderAgeChart       from '@/components/GenderAgeChart'

const PRESET_RANGES   = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }]
const AUTO_REFRESH_MS = 30 * 60 * 1000

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/* ── Skeletons ────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

function SkeletonChart({ height = 296, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-5" />
      <div className="bg-gray-100 rounded-xl" style={{ height }} />
    </div>
  )
}

/* ── Section divider ──────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

/* ── Icon buttons ─────────────────────────────────────────────────────────── */
function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="w-8 h-8 flex items-center justify-center rounded-full
        bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-500 transition-colors">
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  // ── Date range state ─────────────────────────────────────────────────────
  // activeDateRange drives the actual fetch; inputStart/End are the pending
  // values in the custom date inputs (not yet applied).
  const [activeDateRange, setActiveDateRange] = useState({ type: 'preset', days: 30 })
  const [showCustom,  setShowCustom]  = useState(false)
  const [inputStart,  setInputStart]  = useState('')
  const [inputEnd,    setInputEnd]    = useState('')

  // ── Data state ───────────────────────────────────────────────────────────
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [countdown,   setCountdown]   = useState(AUTO_REFRESH_MS)

  // ── Computed label ───────────────────────────────────────────────────────
  const dateRangeLabel = activeDateRange.type === 'custom'
    ? `${fmtDate(activeDateRange.start)} – ${fmtDate(activeDateRange.end)}`
    : `Last ${activeDateRange.days} days`

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const url = activeDateRange.type === 'custom'
      ? `/api/analytics?startDate=${activeDateRange.start}&endDate=${activeDateRange.end}`
      : `/api/analytics?days=${activeDateRange.days}`

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      setData(await res.json())
      setLastUpdated(new Date())
      setCountdown(AUTO_REFRESH_MS)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeDateRange])

  useEffect(() => { fetchData() },                             [fetchData])
  useEffect(() => { const t = setInterval(fetchData, AUTO_REFRESH_MS); return () => clearInterval(t) }, [fetchData])
  useEffect(() => { const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1000)), 1000); return () => clearInterval(t) }, [lastUpdated])

  // ── Actions ───────────────────────────────────────────────────────────────
  function selectPreset(days) {
    setActiveDateRange({ type: 'preset', days })
    setShowCustom(false)
  }

  function applyCustom() {
    if (!inputStart || !inputEnd || inputStart > inputEnd) return
    setActiveDateRange({ type: 'custom', start: inputStart, end: inputEnd })
    setShowCustom(false)
  }

  function handleExportPDF() {
    window.print()
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  // ── KPI config ────────────────────────────────────────────────────────────
  const kpiCards = data ? [
    { title: 'Sessions',     value: data.kpis.sessions.value,           change: data.kpis.sessions.change,           icon: '📊' },
    { title: 'Active Users', value: data.kpis.users.value,              change: data.kpis.users.change,              icon: '👥' },
    { title: 'New Users',    value: data.kpis.newUsers.value,           change: data.kpis.newUsers.change,           icon: '✨' },
    { title: 'Page Views',   value: data.kpis.pageviews.value,          change: data.kpis.pageviews.change,          icon: '👁️' },
    { title: 'Bounce Rate',  value: data.kpis.bounceRate.value,         change: data.kpis.bounceRate.change,         icon: '↩️', format: 'percentage' },
    { title: 'Avg. Session', value: data.kpis.avgSessionDuration.value, change: data.kpis.avgSessionDuration.change, icon: '⏱️', format: 'duration' },
  ] : []

  const nextRefreshMins = Math.ceil(countdown / 60000)
  const canApply = inputStart && inputEnd && inputStart <= inputEnd

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Print-only masthead (hidden on screen) ────────────────────────── */}
      <div className="hidden print:block px-8 pt-6 pb-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">GA4 Analytics Dashboard</h1>
        </div>
        <p className="text-sm text-gray-500">
          {dateRangeLabel} &middot; Exported{' '}
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* ── Screen header (hidden on print) ───────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

          {/* Row 1: title + controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-base font-bold text-gray-900">GA4 Analytics</h1>
              </div>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-0.5 ml-9">
                  {dateRangeLabel} &middot; updated {lastUpdated.toLocaleTimeString()} &middot; refreshes in {nextRefreshMins}m
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date range pills */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                {PRESET_RANGES.map(({ label, value }) => (
                  <button key={value} onClick={() => selectPreset(value)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      !showCustom && activeDateRange.type === 'preset' && activeDateRange.days === value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setShowCustom((v) => !v)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    showCustom || activeDateRange.type === 'custom'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  Custom
                </button>
              </div>

              {/* Refresh */}
              <IconBtn onClick={fetchData} disabled={loading} title="Refresh now">
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </IconBtn>

              {/* Export PDF */}
              <IconBtn onClick={handleExportPDF} title="Export to PDF">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </IconBtn>

              {/* Logout */}
              <IconBtn onClick={handleLogout} title="Sign out">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </IconBtn>
            </div>
          </div>

          {/* Row 2: custom date inputs (slide in when Custom is toggled) */}
          {showCustom && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">From</label>
                <input
                  type="date"
                  value={inputStart}
                  max={inputEnd || today()}
                  onChange={(e) => setInputStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">To</label>
                <input
                  type="date"
                  value={inputEnd}
                  min={inputStart || undefined}
                  max={today()}
                  onChange={(e) => setInputEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={!canApply}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40
                  text-white text-xs font-semibold rounded-lg transition-colors">
                Apply
              </button>
              {!canApply && inputStart && inputEnd && (
                <span className="text-xs text-red-500">End date must be after start date</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6
        print:max-w-none print:px-6 print:py-4">

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200
            rounded-xl px-4 py-3 text-sm text-red-700 print:hidden">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            <span><strong>Error:</strong> {error}</span>
          </div>
        )}

        {/* ── Overview KPIs ──────────────────────────────────────────────── */}
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading && !data
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((kpi) => <KPICard key={kpi.title} {...kpi} />)}
        </div>

        {/* Time series */}
        {loading && !data ? <SkeletonChart height={280} /> : data && <LineChart data={data.timeSeriesData} />}

        {/* ── Acquisition ────────────────────────────────────────────────── */}
        <SectionLabel>Acquisition</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !data ? (
            <><SkeletonChart /><SkeletonChart /></>
          ) : data && (
            <>
              <DonutChart        data={data.trafficSourcesData} />
              <SocialSourceChart data={data.sessionSourcesData} />
            </>
          )}
        </div>

        {/* ── Devices & Streams ──────────────────────────────────────────── */}
        <SectionLabel>Devices &amp; Streams</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !data ? (
            <><SkeletonChart /><SkeletonChart /></>
          ) : data && (
            <>
              <PlatformChart data={data.platformBreakdown} />
              <StreamChart   data={data.streamNamesData} />
            </>
          )}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <SectionLabel>Content</SectionLabel>
        {loading && !data ? <SkeletonChart height={280} /> : data && <BarChart data={data.topPagesData} />}

        {/* ── Ecommerce ──────────────────────────────────────────────────── */}
        <SectionLabel>Ecommerce</SectionLabel>
        {loading && !data ? <SkeletonChart height={240} /> : data && <AbandonedCartsWidget data={data.abandonedCartsData} />}

        {/* ── Conversions ────────────────────────────────────────────────── */}
        <SectionLabel>Conversions</SectionLabel>
        {loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.conversionRates && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Overall Conv. Rate', scope: 'All platforms', cr: data.conversionRates.overall },
              { title: 'Web Conv. Rate',     scope: 'Web only',      cr: data.conversionRates.web },
              { title: 'App Conv. Rate',     scope: 'iOS + Android', cr: data.conversionRates.app },
            ].map(({ title, scope, cr }) => {
              const up = cr.change >= 0
              return (
                <div key={title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
                  <p className="text-xs text-gray-400 mb-3">{scope}</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums mb-2">
                    {cr.value.toFixed(2)}%
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {up ? '▲' : '▼'} {Math.abs(cr.change).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">vs prev period</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 tabular-nums">
                    {cr.conversions.toLocaleString()} conversions · {cr.sessions.toLocaleString()} sessions
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Demographics ───────────────────────────────────────────────── */}
        <SectionLabel>Demographics</SectionLabel>
        {loading && !data ? <SkeletonChart height={240} /> : data && (
          <GenderAgeChart genderData={data.genderBreakdown} ageData={data.ageBreakdown} />
        )}

        <p className="text-center text-xs text-gray-400 pb-4 print:hidden">
          Google Analytics 4 · Property 258025001 · auto-refreshes every 30 min
        </p>
      </main>
    </div>
  )
}
