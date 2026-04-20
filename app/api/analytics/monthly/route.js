import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthToDateRange(ym) {
  const year  = parseInt(ym.slice(0, 4))
  const month = parseInt(ym.slice(4)) - 1   // 0-indexed
  const startDate = new Date(Date.UTC(year, month, 1))
  const endDate   = new Date(Date.UTC(year, month + 1, 0))  // last day of month
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
      dimensions: [{ name: 'yearMonth' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'ecommercePurchases' },
      ],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' }, desc: true }],
      limit: 60,
    })

    const rows = (report.rows ?? []).map((row) => {
      const ym        = row.dimensionValues[0].value          // "202301"
      const year      = parseInt(ym.slice(0, 4))
      const monthIdx  = parseInt(ym.slice(4)) - 1
      const sessions  = parseInt(row.metricValues[0].value, 10)
      const purchases = parseInt(row.metricValues[6].value, 10)
      const { startDate, endDate } = monthToDateRange(ym)
      return {
        period:             ym,
        label:              `${MONTHS[monthIdx]} ${year}`,
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
    console.error('[GA4] monthly error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
