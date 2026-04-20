import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

function metricVal(row, index) {
  return parseFloat(row?.metricValues?.[index]?.value ?? '0')
}

function pctChange(current, previous) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Normalize raw GA4 session source values to clean display names
function normalizeSource(source) {
  const s = (source || '').toLowerCase()
  if (s.includes('google') || s === 'adwords') return 'Google'
  if (s.includes('instagram') || s === 'ig' || s.includes('l.instagram')) return 'Instagram'
  if (s.includes('tiktok') || s.includes('tik_tok') || s.includes('musical.ly')) return 'TikTok'
  if (s.includes('facebook') || s.includes('l.facebook') || s === 'fb') return 'Facebook'
  if (s.includes('snapchat') || s.includes('snap.com')) return 'Snapchat'
  if (s.includes('twitter') || s.includes('t.co') || s.includes('x.com')) return 'Twitter/X'
  if (s.includes('youtube') || s.includes('youtu.be')) return 'YouTube'
  if (s.includes('linkedin')) return 'LinkedIn'
  if (s === '(direct)' || s === 'direct' || s === '(none)') return 'Direct'
  if (s === '(not set)' || s === 'not set' || s === '') return 'Other'
  return source
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const startParam = searchParams.get('startDate')   // YYYY-MM-DD custom range
  const endParam   = searchParams.get('endDate')     // YYYY-MM-DD custom range
  const yoyParam   = searchParams.get('yoy')         // '1' = also fetch same month last year

  let currentStart, currentEnd, prevStart, prevEnd, timeSeriesLimit, yoyStart, yoyEnd

  if (startParam && endParam) {
    // ── Custom date range ────────────────────────────────────────────────────
    currentStart = startParam
    currentEnd   = endParam
    const MS      = 86400000
    const startMs = new Date(startParam).getTime()
    const endMs   = new Date(endParam).getTime()
    timeSeriesLimit = Math.min(Math.round((endMs - startMs) / MS) + 1, 365)
    // Previous period = same length, immediately before currentStart
    const prevEndMs   = startMs - MS
    const prevStartMs = prevEndMs - (timeSeriesLimit - 1) * MS
    prevEnd   = new Date(prevEndMs).toISOString().slice(0, 10)
    prevStart = new Date(prevStartMs).toISOString().slice(0, 10)
    // Year-over-year = same date range one year prior
    if (yoyParam === '1') {
      const yS = new Date(startParam); yS.setFullYear(yS.getFullYear() - 1)
      const yE = new Date(endParam);   yE.setFullYear(yE.getFullYear() - 1)
      yoyStart = yS.toISOString().slice(0, 10)
      yoyEnd   = yE.toISOString().slice(0, 10)
    }
  } else {
    // ── Preset range (NdaysAgo → yesterday = N complete days) ───────────────
    const days      = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365)
    currentStart    = `${days}daysAgo`
    currentEnd      = 'yesterday'
    prevStart       = `${days * 2}daysAgo`
    prevEnd         = `${days + 1}daysAgo`
    timeSeriesLimit = days
  }

  try {
    const baseResults = await Promise.all([

      // ── KPI totals: current period ─────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        metrics: [
          { name: 'sessions' }, { name: 'activeUsers' },
          { name: 'screenPageViews' }, { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'newUsers' },             // index 5
          { name: 'ecommercePurchases' },   // index 6
        ],
      }),

      // ── KPI totals: previous period (for % change) ─────────────────────────
      runReport({
        startDate: prevStart, endDate: prevEnd,
        metrics: [
          { name: 'sessions' }, { name: 'activeUsers' },
          { name: 'screenPageViews' }, { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'newUsers' },             // index 5
          { name: 'ecommercePurchases' },   // index 6
        ],
      }),

      // ── Daily time series ──────────────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: timeSeriesLimit,
      }),

      // ── Top 10 pages ───────────────────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),

      // ── Channel group traffic sources ──────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),

      // ── Platform (iOS / Android / Web) ─────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'platform' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),

      // ── Session sources (raw — will be normalised below) ───────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 25,
      }),

      // ── Stream names ───────────────────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'streamName' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),

      // ── Abandoned carts: overall ───────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        metrics: [
          { name: 'addToCarts' },
          { name: 'ecommercePurchases' },
          { name: 'checkouts' },
        ],
      }),

      // ── Abandoned carts: per device ────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'addToCarts' }, { name: 'ecommercePurchases' }],
        orderBys: [{ metric: { metricName: 'addToCarts' }, desc: true }],
      }),

      // ── Active users by gender ─────────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'userGender' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),

      // ── Active users by age bracket ────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'userAgeBracket' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'userAgeBracket' } }],
      }),

      // ── Platform purchases: current period ────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'platform' }],
        metrics: [{ name: 'ecommercePurchases' }, { name: 'sessions' }],
      }),

      // ── Platform purchases: previous period ───────────────────────────────
      runReport({
        startDate: prevStart, endDate: prevEnd,
        dimensions: [{ name: 'platform' }],
        metrics: [{ name: 'ecommercePurchases' }, { name: 'sessions' }],
      }),

      // ── Top products by revenue ────────────────────────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        dimensions: [{ name: 'itemName' }],
        metrics: [
          { name: 'itemRevenue' },
          { name: 'itemsPurchased' },
          { name: 'itemsAddedToCart' },
        ],
        orderBys: [{ metric: { metricName: 'itemRevenue' }, desc: true }],
        limit: 10,
      }),

      // ── Abandoned carts: previous period ──────────────────────────────────
      runReport({
        startDate: prevStart, endDate: prevEnd,
        metrics: [
          { name: 'addToCarts' },
          { name: 'ecommercePurchases' },
        ],
      }),

      // ── Search results page views: current period ─────────────────────────
      runReport({
        startDate: currentStart, endDate: currentEnd,
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePathPlusQueryString',
            stringFilter: { matchType: 'CONTAINS', value: 'SearchResults' },
          },
        },
      }),

      // ── Search results page views: previous period ────────────────────────
      runReport({
        startDate: prevStart, endDate: prevEnd,
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePathPlusQueryString',
            stringFilter: { matchType: 'CONTAINS', value: 'SearchResults' },
          },
        },
      }),
    ])

    const [
      kpiCurrent, kpiPrev, timeSeries, topPages, sources,
      platformData, sessionSourcesRaw, streamData,
      cartsOverall, cartsPerDevice, genderData, ageData,
      platformConvCur, platformConvPrv, productData,
      cartsPrev, searchCur, searchPrev,
    ] = baseResults

    // ── Year-over-year queries (only when yoy=1 on a custom range) ─────────
    const [yoyKpi, yoyPlatformConv, yoyCarts, yoySearch] = yoyStart
      ? await Promise.all([
          runReport({
            startDate: yoyStart, endDate: yoyEnd,
            metrics: [
              { name: 'sessions' }, { name: 'activeUsers' },
              { name: 'screenPageViews' }, { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
              { name: 'newUsers' },
              { name: 'ecommercePurchases' },
            ],
          }),
          runReport({
            startDate: yoyStart, endDate: yoyEnd,
            dimensions: [{ name: 'platform' }],
            metrics: [{ name: 'ecommercePurchases' }, { name: 'sessions' }],
          }),
          runReport({
            startDate: yoyStart, endDate: yoyEnd,
            metrics: [{ name: 'addToCarts' }, { name: 'ecommercePurchases' }],
          }),
          runReport({
            startDate: yoyStart, endDate: yoyEnd,
            metrics: [{ name: 'screenPageViews' }],
            dimensionFilter: {
              filter: {
                fieldName: 'pagePathPlusQueryString',
                stringFilter: { matchType: 'CONTAINS', value: 'SearchResults' },
              },
            },
          }),
        ])
      : [null, null, null, null]

    // ── Process: KPIs ──────────────────────────────────────────────────────
    const cur = kpiCurrent.rows?.[0]
    const prv = kpiPrev.rows?.[0]

    const kpis = {
      sessions:           { value: metricVal(cur, 0), change: pctChange(metricVal(cur, 0), metricVal(prv, 0)) },
      users:              { value: metricVal(cur, 1), change: pctChange(metricVal(cur, 1), metricVal(prv, 1)) },
      pageviews:          { value: metricVal(cur, 2), change: pctChange(metricVal(cur, 2), metricVal(prv, 2)) },
      bounceRate:         { value: metricVal(cur, 3) * 100, change: pctChange(metricVal(cur, 3), metricVal(prv, 3)) },
      avgSessionDuration: { value: metricVal(cur, 4), change: pctChange(metricVal(cur, 4), metricVal(prv, 4)) },
      newUsers:           { value: metricVal(cur, 5), change: pctChange(metricVal(cur, 5), metricVal(prv, 5)) },
    }

    // ── Process: conversion rates (purchases / sessions) ──────────────────
    const curSessions    = metricVal(cur, 0)
    const prvSessions    = metricVal(prv, 0)
    const curPurchases   = metricVal(cur, 6)
    const prvPurchases   = metricVal(prv, 6)
    const curOverallRate = curSessions > 0 ? (curPurchases / curSessions) * 100 : 0
    const prvOverallRate = prvSessions > 0 ? (prvPurchases / prvSessions) * 100 : 0

    // Per-platform helpers
    function platformRow(report, platform) {
      return report.rows?.find((r) => r.dimensionValues[0].value === platform)
    }
    function purchaseRate(row) {
      const purchases = parseInt(row?.metricValues?.[0]?.value ?? '0', 10)
      const sess      = parseInt(row?.metricValues?.[1]?.value ?? '0', 10)
      return { purchases, sess, rate: sess > 0 ? (purchases / sess) * 100 : 0 }
    }

    // Web
    const webCur = purchaseRate(platformRow(platformConvCur, 'web'))
    const webPrv = purchaseRate(platformRow(platformConvPrv, 'web'))

    // App = iOS + Android combined
    function addPlatforms(report, ...platforms) {
      let purchases = 0, sess = 0
      platforms.forEach((p) => {
        const r = platformRow(report, p)
        purchases += parseInt(r?.metricValues?.[0]?.value ?? '0', 10)
        sess      += parseInt(r?.metricValues?.[1]?.value ?? '0', 10)
      })
      return { purchases, sess, rate: sess > 0 ? (purchases / sess) * 100 : 0 }
    }
    const appCur = addPlatforms(platformConvCur, 'iOS', 'Android')
    const appPrv = addPlatforms(platformConvPrv, 'iOS', 'Android')

    const conversionRates = {
      overall: {
        value:     curOverallRate,
        change:    pctChange(curOverallRate, prvOverallRate),
        purchases: Math.round(curPurchases),
        sessions:  Math.round(curSessions),
      },
      web: {
        value:     webCur.rate,
        change:    pctChange(webCur.rate, webPrv.rate),
        purchases: webCur.purchases,
        sessions:  webCur.sess,
      },
      app: {
        value:     appCur.rate,
        change:    pctChange(appCur.rate, appPrv.rate),
        purchases: appCur.purchases,
        sessions:  appCur.sess,
      },
    }

    // ── Process: time series ───────────────────────────────────────────────
    const timeSeriesData = (timeSeries.rows ?? []).map((row) => ({
      date:     row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      users:    parseInt(row.metricValues[1].value, 10),
    }))

    // ── Process: top pages ─────────────────────────────────────────────────
    const topPagesData = (topPages.rows ?? []).map((row) => ({
      page:      row.dimensionValues[0].value || '/',
      pageviews: parseInt(row.metricValues[0].value, 10),
      sessions:  parseInt(row.metricValues[1].value, 10),
    }))

    // ── Process: channel traffic sources ──────────────────────────────────
    const trafficSourcesData = (sources.rows ?? []).map((row) => ({
      source:   row.dimensionValues[0].value || 'Direct',
      sessions: parseInt(row.metricValues[0].value, 10),
    }))

    // ── Process: platform (iOS / Android / Web) ────────────────────────────
    const platformBreakdown = (platformData.rows ?? [])
      .map((row) => {
        const raw = row.dimensionValues[0].value
        return {
          platform: raw === 'web' ? 'Web' : raw === '(not set)' ? 'Other' : raw,
          sessions: parseInt(row.metricValues[0].value, 10),
        }
      })
      .filter((d) => d.sessions > 0)

    // ── Process: session sources (merge normalised duplicates) ─────────────
    const sourceMap = {}
    ;(sessionSourcesRaw.rows ?? []).forEach((row) => {
      const name     = normalizeSource(row.dimensionValues[0].value)
      const sessions = parseInt(row.metricValues[0].value, 10)
      sourceMap[name] = (sourceMap[name] || 0) + sessions
    })
    const sessionSourcesData = Object.entries(sourceMap)
      .map(([source, sessions]) => ({ source, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10)

    // ── Process: stream names ──────────────────────────────────────────────
    const streamNamesData = (streamData.rows ?? []).map((row) => ({
      stream:   row.dimensionValues[0].value || 'Unknown',
      sessions: parseInt(row.metricValues[0].value, 10),
      users:    parseInt(row.metricValues[1].value, 10),
    }))

    // ── Process: abandoned carts ───────────────────────────────────────────
    const cartsRow        = cartsOverall.rows?.[0]
    const totalAddToCarts = parseInt(cartsRow?.metricValues?.[0]?.value ?? '0', 10)
    const totalPurchases  = parseInt(cartsRow?.metricValues?.[1]?.value ?? '0', 10)
    const totalCheckouts  = parseInt(cartsRow?.metricValues?.[2]?.value ?? '0', 10)
    const totalAbandoned  = Math.max(0, totalAddToCarts - totalPurchases)

    const abandonedCartsData = {
      addToCarts:    totalAddToCarts,
      purchases:     totalPurchases,
      checkouts:     totalCheckouts,
      abandoned:     totalAbandoned,
      abandonedRate: totalAddToCarts > 0 ? (totalAbandoned / totalAddToCarts) * 100 : 0,
      perDevice: (cartsPerDevice.rows ?? []).map((row) => {
        const adds      = parseInt(row.metricValues[0].value, 10)
        const purchases = parseInt(row.metricValues[1].value, 10)
        const abandoned = Math.max(0, adds - purchases)
        return {
          device:        row.dimensionValues[0].value,
          addToCarts:    adds,
          purchases,
          abandoned,
          abandonedRate: adds > 0 ? (abandoned / adds) * 100 : 0,
        }
      }),
    }

    // ── Process: gender ────────────────────────────────────────────────────
    const DEMO_EXCLUDE = new Set(['(not set)', 'unknown', ''])
    const genderBreakdown = (genderData.rows ?? [])
      .filter((row) => !DEMO_EXCLUDE.has(row.dimensionValues[0].value))
      .map((row) => ({
        gender: row.dimensionValues[0].value,
        users:  parseInt(row.metricValues[0].value, 10),
      }))

    // ── Process: age brackets ──────────────────────────────────────────────
    const ageBreakdown = (ageData.rows ?? [])
      .filter((row) => !DEMO_EXCLUDE.has(row.dimensionValues[0].value))
      .map((row) => ({
        age:   row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value, 10),
      }))

    // ── Process: product performance ──────────────────────────────────────
    const productPerformance = (productData.rows ?? [])
      .filter((row) => {
        const name = row.dimensionValues[0].value
        return name && name !== '(not set)' && name !== ''
      })
      .map((row) => ({
        name:       row.dimensionValues[0].value,
        revenue:    parseFloat(row.metricValues[0].value ?? '0'),
        purchases:  parseInt(row.metricValues[1].value ?? '0', 10),
        addToCarts: parseInt(row.metricValues[2].value ?? '0', 10),
      }))

    // ── Process: period comparison ─────────────────────────────────────────
    function ga4DateToISO(d) {
      if (d === 'today')     { const t = new Date(); return t.toISOString().slice(0, 10) }
      if (d === 'yesterday') { const t = new Date(); t.setDate(t.getDate() - 1); return t.toISOString().slice(0, 10) }
      const m = d.match(/^(\d+)daysAgo$/)
      if (m) { const t = new Date(); t.setDate(t.getDate() - parseInt(m[1])); return t.toISOString().slice(0, 10) }
      return d
    }
    function fmtPeriod(start, end) {
      const f = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${f(ga4DateToISO(start))} – ${f(ga4DateToISO(end))}`
    }
    function platSessions(report, platform) {
      const row = platformRow(report, platform)
      return parseInt(row?.metricValues?.[1]?.value ?? '0', 10)
    }

    const prevCartsRow      = cartsPrev.rows?.[0]
    const prevAddToCarts    = parseInt(prevCartsRow?.metricValues?.[0]?.value ?? '0', 10)
    const prevCartPurchases = parseInt(prevCartsRow?.metricValues?.[1]?.value ?? '0', 10)
    const prevAbandoned     = Math.max(0, prevAddToCarts - prevCartPurchases)
    const prevAbandonedRate = prevAddToCarts > 0 ? (prevAbandoned / prevAddToCarts) * 100 : 0

    const curSearchCount  = parseInt(searchCur.rows?.[0]?.metricValues?.[0]?.value  ?? '0', 10)
    const prevSearchCount = parseInt(searchPrev.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10)

    const periodComparison = {
      currentLabel:  fmtPeriod(currentStart, currentEnd),
      previousLabel: fmtPeriod(prevStart, prevEnd),
      rows: [
        { label: 'Users',                         current: Math.round(metricVal(cur, 1)),  previous: Math.round(metricVal(prv, 1)),  format: 'number'  },
        { label: 'Sessions',                      current: Math.round(metricVal(cur, 0)),  previous: Math.round(metricVal(prv, 0)),  format: 'number'  },
        { label: 'New Users',                     current: Math.round(metricVal(cur, 5)),  previous: Math.round(metricVal(prv, 5)),  format: 'number'  },
        { label: 'Search Results',                current: curSearchCount,                 previous: prevSearchCount,                format: 'number'  },
        { label: 'Conversion (Website)',          current: webCur.purchases,               previous: webPrv.purchases,               format: 'number'  },
        { label: 'Conversion Rate (Website)',     current: webCur.rate,                    previous: webPrv.rate,                    format: 'percent' },
        { label: 'Total Conversions',             current: Math.round(curPurchases),       previous: Math.round(prvPurchases),       format: 'number'  },
        { label: 'Total Conversion Rate',         current: curOverallRate,                 previous: prvOverallRate,                 format: 'percent' },
        { label: 'Conversion (App)',              current: appCur.purchases,               previous: appPrv.purchases,               format: 'number'  },
        { label: 'Conversion Rate (App)',         current: appCur.rate,                    previous: appPrv.rate,                    format: 'percent' },
        { label: 'Bounce Rate',                   current: metricVal(cur, 3) * 100,        previous: metricVal(prv, 3) * 100,        format: 'percent' },
        { label: 'Source Of Traffic (Website)',   current: platSessions(platformConvCur, 'web'),     previous: platSessions(platformConvPrv, 'web'),     format: 'number' },
        { label: 'Source Of Traffic (iOS)',       current: platSessions(platformConvCur, 'iOS'),     previous: platSessions(platformConvPrv, 'iOS'),     format: 'number' },
        { label: 'Source Of Traffic (Android)',   current: platSessions(platformConvCur, 'Android'), previous: platSessions(platformConvPrv, 'Android'), format: 'number' },
        { label: 'Carts Abandonment',             current: totalAbandoned,                 previous: prevAbandoned,                  format: 'number'  },
        { label: 'Carts Abandonment Rate',        current: totalAddToCarts > 0 ? (totalAbandoned / totalAddToCarts) * 100 : 0, previous: prevAbandonedRate, format: 'percent' },
      ],
    }

    // ── Process: year-over-year comparison ────────────────────────────────
    let yoyComparison = null
    if (yoyStart && yoyKpi) {
      const yoy    = yoyKpi.rows?.[0]
      const yoySess = parseFloat(yoy?.metricValues?.[0]?.value ?? '0')
      const yoyPurch = parseFloat(yoy?.metricValues?.[6]?.value ?? '0')
      const yoyOverallRate = yoySess > 0 ? (yoyPurch / yoySess) * 100 : 0

      const yoyWebCur = purchaseRate(platformRow(yoyPlatformConv, 'web'))
      const yoyAppCur = addPlatforms(yoyPlatformConv, 'iOS', 'Android')

      const yoyCartsRow  = yoyCarts?.rows?.[0]
      const yoyAdds      = parseInt(yoyCartsRow?.metricValues?.[0]?.value ?? '0', 10)
      const yoyCartPurch = parseInt(yoyCartsRow?.metricValues?.[1]?.value ?? '0', 10)
      const yoyAbandoned = Math.max(0, yoyAdds - yoyCartPurch)

      const yoySearchCount = parseInt(yoySearch?.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10)

      yoyComparison = {
        currentLabel:  fmtPeriod(currentStart, currentEnd),
        previousLabel: fmtPeriod(yoyStart, yoyEnd),
        rows: [
          { label: 'Users',                         current: Math.round(metricVal(cur, 1)),  previous: Math.round(metricVal(yoy, 1)),  format: 'number'  },
          { label: 'Sessions',                      current: Math.round(metricVal(cur, 0)),  previous: Math.round(metricVal(yoy, 0)),  format: 'number'  },
          { label: 'New Users',                     current: Math.round(metricVal(cur, 5)),  previous: Math.round(metricVal(yoy, 5)),  format: 'number'  },
          { label: 'Search Results',                current: curSearchCount,                 previous: yoySearchCount,                 format: 'number'  },
          { label: 'Conversion (Website)',          current: webCur.purchases,               previous: yoyWebCur.purchases,            format: 'number'  },
          { label: 'Conversion Rate (Website)',     current: webCur.rate,                    previous: yoyWebCur.rate,                 format: 'percent' },
          { label: 'Total Conversions',             current: Math.round(curPurchases),       previous: Math.round(yoyPurch),           format: 'number'  },
          { label: 'Total Conversion Rate',         current: curOverallRate,                 previous: yoyOverallRate,                 format: 'percent' },
          { label: 'Conversion (App)',              current: appCur.purchases,               previous: yoyAppCur.purchases,            format: 'number'  },
          { label: 'Conversion Rate (App)',         current: appCur.rate,                    previous: yoyAppCur.rate,                 format: 'percent' },
          { label: 'Bounce Rate',                   current: metricVal(cur, 3) * 100,        previous: metricVal(yoy, 3) * 100,        format: 'percent' },
          { label: 'Source Of Traffic (Website)',   current: platSessions(platformConvCur, 'web'),     previous: platSessions(yoyPlatformConv, 'web'),     format: 'number' },
          { label: 'Source Of Traffic (iOS)',       current: platSessions(platformConvCur, 'iOS'),     previous: platSessions(yoyPlatformConv, 'iOS'),     format: 'number' },
          { label: 'Source Of Traffic (Android)',   current: platSessions(platformConvCur, 'Android'), previous: platSessions(yoyPlatformConv, 'Android'), format: 'number' },
          { label: 'Carts Abandonment',             current: totalAbandoned,                 previous: yoyAbandoned,                   format: 'number'  },
          { label: 'Carts Abandonment Rate',        current: totalAddToCarts > 0 ? (totalAbandoned / totalAddToCarts) * 100 : 0, previous: yoyAdds > 0 ? (yoyAbandoned / yoyAdds) * 100 : 0, format: 'percent' },
        ],
      }
    }

    return NextResponse.json({
      kpis,
      timeSeriesData,
      topPagesData,
      trafficSourcesData,
      platformBreakdown,
      sessionSourcesData,
      streamNamesData,
      abandonedCartsData,
      genderBreakdown,
      ageBreakdown,
      conversionRates,
      productPerformance,
      periodComparison,
      yoyComparison,
    })
  } catch (err) {
    console.error('[GA4] API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
