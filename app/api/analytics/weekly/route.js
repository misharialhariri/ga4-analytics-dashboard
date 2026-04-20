import { NextResponse } from 'next/server'
import { runReport } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

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
      return {
        period:             yw,
        label:              `${year} W${String(week).padStart(2, '0')}`,
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
