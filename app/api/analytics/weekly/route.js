import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

// GA4 weeks start on Sunday; yearWeek "YYYYWW" → ISO date range
function weekToDateRange(yw) {
  const year = parseInt(yw.slice(0, 4))
  const week = parseInt(yw.slice(4))
  const jan1 = new Date(Date.UTC(year, 0, 1))
  // Roll back to the Sunday on or before Jan 1
  const week1Sun = new Date(jan1)
  week1Sun.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay())
  const startDate = new Date(week1Sun)
  startDate.setUTCDate(week1Sun.getUTCDate() + (week - 1) * 7)
  const endDate = new Date(startDate)
  endDate.setUTCDate(startDate.getUTCDate() + 6)
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate:   endDate.toISOString().slice(0, 10),
  }
}

export async function GET() {
  try {
    const report = await runReport({
      startDate: '2023-01-01',
      endDate: 'yesterday',
      dimensions: [{ name: 'yearWeek' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'ecommercePurchases' },
      ],
      orderBys: [{ dimension: { dimensionName: 'yearWeek' }, desc: true }],
      limit: 250,
    })

    const rows = (report.rows ?? []).map((row) => {
      const yw       = row.dimensionValues[0].value          // "202301"
      const year     = parseInt(yw.slice(0, 4))
      const week     = parseInt(yw.slice(4))
      const sessions = parseInt(row.metricValues[0].value, 10)
      const purchases = parseInt(row.metricValues[6].value, 10)
      const { startDate, endDate } = weekToDateRange(yw)
      return {
        period:             yw,
        label:              `${year} W${String(week).padStart(2, '0')}`,
        startDate,
        endDate,
        sessions,
        users:              parseInt(row.metricValues[1].value, 10),
        newUsers:           parseInt(row.metricValues[2].value, 10),
        pageViews:          parseInt(row.metricValues[3].value, 10),
        bounceRate:         parseFloat(row.metricValues[4].value) * 100,
        avgSessionDuration: parseFloat(row.metricValues[5].value),
        purchases,
        conversionRate:     sessions > 0 ? (purchases / sessions) * 100 : 0,
      }
    })

    return NextResponse.json({ rows })
  } catch (err) {
    console.error('[GA4] weekly error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
