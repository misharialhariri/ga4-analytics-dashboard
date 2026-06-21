import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

function metricVal(row, index) {
  return parseFloat(row?.metricValues?.[index]?.value ?? '0')
}

function addYears(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setFullYear(d.getFullYear() + n)
  return d.toISOString().slice(0, 10)
}

function isoWeekNum(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const y1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - y1) / 86400000 + 1) / 7)
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

// Build labels for each period
function makeLabels(start, end, type) {
  const year = new Date(end + 'T00:00:00').getFullYear()
  const prevYear = year - 1
  if (type === 'day') {
    return { current: fmtDate(end), previous: fmtDate(addYears(end, -1)) }
  }
  if (type === 'week') {
    const wk = isoWeekNum(end)
    return {
      current:  `W${wk} · ${fmtDateShort(start)}–${fmtDateShort(end)}, ${year}`,
      previous: `W${wk} · ${fmtDateShort(addYears(start,-1))}–${fmtDateShort(addYears(end,-1))}, ${prevYear}`,
    }
  }
  // mtd
  return {
    current:  `${fmtDateShort(start)}–${fmtDateShort(end)}, ${year}`,
    previous: `${fmtDateShort(addYears(start,-1))}–${fmtDateShort(addYears(end,-1))}, ${prevYear}`,
  }
}

// Extract platform sessions from a platform-dimension report
function platformSessions(report, platform) {
  const row = report.rows?.find((r) => r.dimensionValues[0].value === platform)
  return parseInt(row?.metricValues?.[0]?.value ?? '0', 10)
}

// Fetch metrics for a single date range
async function fetchPeriod(start, end) {
  const [overall, byPlatform] = await Promise.all([
    runReport({
      startDate: start, endDate: end,
      metrics: [{ name: 'sessions' }, { name: 'ecommercePurchases' }],
    }),
    runReport({
      startDate: start, endDate: end,
      dimensions: [{ name: 'platform' }],
      metrics: [{ name: 'sessions' }],
    }),
  ])

  const row = overall.rows?.[0]
  const sessions     = Math.round(metricVal(row, 0))
  const conversions  = Math.round(metricVal(row, 1))
  const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0

  return {
    sessions,
    conversions,
    conversionRate,
    webSessions:     platformSessions(byPlatform, 'web'),
    iosSessions:     platformSessions(byPlatform, 'iOS'),
    androidSessions: platformSessions(byPlatform, 'Android'),
  }
}

export async function GET() {
  const yd = new Date()
  yd.setDate(yd.getDate() - 1)
  const yesterday = yd.toISOString().slice(0, 10)

  // Week: 7 days ending yesterday
  const weekStartDate = new Date(yd)
  weekStartDate.setDate(weekStartDate.getDate() - 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)

  // MTD: 1st of current month → yesterday
  const mtdStart = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-01`

  const ranges = [
    { start: yesterday,              end: yesterday,  yoyStart: addYears(yesterday, -1),  yoyEnd: addYears(yesterday, -1),  type: 'day'  },
    { start: weekStart,              end: yesterday,  yoyStart: addYears(weekStart, -1),   yoyEnd: addYears(yesterday, -1),   type: 'week' },
    { start: mtdStart,               end: yesterday,  yoyStart: addYears(mtdStart, -1),    yoyEnd: addYears(yesterday, -1),   type: 'mtd'  },
  ]

  // 12 parallel fetches (current + yoy for each of 3 periods)
  const results = await Promise.allSettled(
    ranges.flatMap(({ start, end, yoyStart, yoyEnd }) => [
      fetchPeriod(start, end),
      fetchPeriod(yoyStart, yoyEnd),
    ])
  )

  function value(r) {
    return r.status === 'fulfilled' ? r.value : { error: r.reason?.message }
  }

  const [dayCur, dayPrev, weekCur, weekPrev, mtdCur, mtdPrev] = results.map(value)

  return NextResponse.json({
    day:  { ...makeLabels(yesterday, yesterday, 'day'),  current: dayCur,  previous: dayPrev  },
    week: { ...makeLabels(weekStart, yesterday, 'week'), current: weekCur, previous: weekPrev },
    mtd:  { ...makeLabels(mtdStart,  yesterday, 'mtd'),  current: mtdCur,  previous: mtdPrev  },
  })
}
