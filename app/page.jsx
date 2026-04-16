'use client'

import { useState, useEffect, useCallback } from 'react'
import KPICard             from '@/components/KPICard'
import LineChart           from '@/components/LineChart'
import BarChart            from '@/components/BarChart'
import DonutChart          from '@/components/DonutChart'
import PlatformChart       from '@/components/PlatformChart'
import SocialSourceChart   from '@/components/SocialSourceChart'
import StreamChart         from '@/components/StreamChart'
import AbandonedCartsWidget from '@/components/AbandonedCartsWidget'
import GenderAgeChart      from '@/components/GenderAgeChart'

const DATE_RANGES     = [{ label: '7 days', value: 7 }, { label: '30 days', value: 30 }, { label: '90 days', value: 90 }]
const AUTO_REFRESH_MS = 30 * 60 * 1000

/* ── Skeleton helpers ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

function SkeletonChart({ height = 316, className = '' }) {
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
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

export default function Dashboard() {
  const [days,        setDays]        = useState(30)
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [countdown,   setCountdown]   = useState(AUTO_REFRESH_MS)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?days=${days}`)
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
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, AUTO_REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1000)), 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  const kpiCards = data ? [
    { title: 'Sessions',       value: data.kpis.sessions.value,           change: data.kpis.sessions.change,           icon: '📊' },
    { title: 'Active Users',   value: data.kpis.users.value,              change: data.kpis.users.change,              icon: '👥' },
    { title: 'Page Views',     value: data.kpis.pageviews.value,          change: data.kpis.pageviews.change,          icon: '👁️' },
    { title: 'Bounce Rate',    value: data.kpis.bounceRate.value,         change: data.kpis.bounceRate.change,         icon: '↩️', format: 'percentage' },
    { title: 'Avg. Session',   value: data.kpis.avgSessionDuration.value, change: data.kpis.avgSessionDuration.change, icon: '⏱️', format: 'duration' },
  ] : []

  const nextRefreshMins = Math.ceil(countdown / 60000)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
          flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

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
                Updated {lastUpdated.toLocaleTimeString()} &middot; refreshes in {nextRefreshMins}m
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {DATE_RANGES.map(({ label, value }) => (
                <button key={value} onClick={() => setDays(value)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    days === value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <button onClick={fetchData} disabled={loading} title="Refresh now"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100
                hover:bg-gray-200 disabled:opacity-40 text-gray-500 transition-colors">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button onClick={handleLogout} title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100
                hover:bg-gray-200 text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200
            rounded-xl px-4 py-3 text-sm text-red-700">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span><strong>Error:</strong> {error}</span>
          </div>
        )}

        {/* ── Overview KPIs ────────────────────────────────────────────────── */}
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading && !data
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((kpi) => <KPICard key={kpi.title} {...kpi} />)}
        </div>

        {/* ── Time series ──────────────────────────────────────────────────── */}
        {loading && !data
          ? <SkeletonChart height={296} />
          : data && <LineChart data={data.timeSeriesData} />}

        {/* ── Acquisition ──────────────────────────────────────────────────── */}
        <SectionLabel>Acquisition</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !data ? (
            <><SkeletonChart height={296} /><SkeletonChart height={296} /></>
          ) : data && (
            <>
              <DonutChart       data={data.trafficSourcesData} />
              <SocialSourceChart data={data.sessionSourcesData} />
            </>
          )}
        </div>

        {/* ── Devices & Streams ─────────────────────────────────────────────── */}
        <SectionLabel>Devices &amp; Streams</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !data ? (
            <><SkeletonChart height={296} /><SkeletonChart height={296} /></>
          ) : data && (
            <>
              <PlatformChart data={data.platformBreakdown} />
              <StreamChart   data={data.streamNamesData} />
            </>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <SectionLabel>Content</SectionLabel>
        {loading && !data
          ? <SkeletonChart height={296} />
          : data && <BarChart data={data.topPagesData} />}

        {/* ── Ecommerce ─────────────────────────────────────────────────────── */}
        <SectionLabel>Ecommerce</SectionLabel>
        {loading && !data
          ? <SkeletonChart height={260} />
          : data && <AbandonedCartsWidget data={data.abandonedCartsData} />}

        {/* ── Demographics ──────────────────────────────────────────────────── */}
        <SectionLabel>Demographics</SectionLabel>
        {loading && !data
          ? <SkeletonChart height={260} />
          : data && (
            <GenderAgeChart
              genderData={data.genderBreakdown}
              ageData={data.ageBreakdown}
            />
          )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Google Analytics 4 &middot; Property 258025001 &middot; Auto-refreshes every 30 min
        </p>
      </main>
    </div>
  )
}
