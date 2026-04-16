import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

// Helper: extract numeric value from a GA4 row
function metricVal(row, index) {
  return parseFloat(row?.metricValues?.[index]?.value ?? '0')
}

// Helper: calculate period-over-period % change
function pctChange(current, previous) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365)

  const currentStart = `${days}daysAgo`
  const currentEnd = 'today'
  const prevStart = `${days * 2}daysAgo`
  const prevEnd = `${days + 1}daysAgo`

  try {
    const [kpiCurrent, kpiPrev, timeSeries, topPages, sources] = await Promise.all([
      // ── Current period totals ──────────────────────────────────────────────
      runReport({
        startDate: currentStart,
        endDate: currentEnd,
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // ── Previous period totals (for WoW / period-over-period change) ───────
      runReport({
        startDate: prevStart,
        endDate: prevEnd,
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // ── Daily time series ──────────────────────────────────────────────────
      runReport({
        startDate: currentStart,
        endDate: currentEnd,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: days,
      }),

      // ── Top 10 pages ───────────────────────────────────────────────────────
      runReport({
        startDate: currentStart,
        endDate: currentEnd,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),

      // ── Traffic sources ────────────────────────────────────────────────────
      runReport({
        startDate: currentStart,
        endDate: currentEnd,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
    ])

    const cur = kpiCurrent.rows?.[0]
    const prv = kpiPrev.rows?.[0]

    const kpis = {
      sessions: {
        value: metricVal(cur, 0),
        change: pctChange(metricVal(cur, 0), metricVal(prv, 0)),
      },
      users: {
        value: metricVal(cur, 1),
        change: pctChange(metricVal(cur, 1), metricVal(prv, 1)),
      },
      pageviews: {
        value: metricVal(cur, 2),
        change: pctChange(metricVal(cur, 2), metricVal(prv, 2)),
      },
      bounceRate: {
        value: metricVal(cur, 3) * 100,
        change: pctChange(metricVal(cur, 3), metricVal(prv, 3)),
      },
      avgSessionDuration: {
        value: metricVal(cur, 4),
        change: pctChange(metricVal(cur, 4), metricVal(prv, 4)),
      },
    }

    const timeSeriesData = (timeSeries.rows ?? []).map((row) => ({
      date: row.dimensionValues[0].value,          // "20240315"
      sessions: parseInt(row.metricValues[0].value, 10),
      users: parseInt(row.metricValues[1].value, 10),
    }))

    const topPagesData = (topPages.rows ?? []).map((row) => ({
      page: row.dimensionValues[0].value || '/',
      pageviews: parseInt(row.metricValues[0].value, 10),
      sessions: parseInt(row.metricValues[1].value, 10),
    }))

    const trafficSourcesData = (sources.rows ?? []).map((row) => ({
      source: row.dimensionValues[0].value || 'Direct',
      sessions: parseInt(row.metricValues[0].value, 10),
    }))

    return NextResponse.json({ kpis, timeSeriesData, topPagesData, trafficSourcesData })
  } catch (err) {
    console.error('[GA4] API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
