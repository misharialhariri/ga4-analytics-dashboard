import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Clarity's Data Export API is limited to 10 requests per project per day,
// so responses are cached hard: in-memory for warm serverless instances and
// via s-maxage for Vercel's edge cache. 12h TTL ≈ 2 upstream calls per day.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000
let cache = { at: 0, payload: null }

const CLARITY_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3'

const EVENT_METRICS = [
  { apiName: 'ScriptErrorCount',  key: 'scriptErrors',    label: 'Script Errors' },
  { apiName: 'ErrorClickCount',   key: 'errorClicks',     label: 'Error Clicks' },
  { apiName: 'RageClickCount',    key: 'rageClicks',      label: 'Rage Clicks' },
  { apiName: 'DeadClickCount',    key: 'deadClicks',      label: 'Dead Clicks' },
  { apiName: 'QuickbackClick',    key: 'quickBacks',      label: 'Quick-back Clicks' },
  { apiName: 'ExcessiveScroll',   key: 'excessiveScroll', label: 'Excessive Scrolling' },
]

function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function buildPayload(raw) {
  const byName = {}
  ;(Array.isArray(raw) ? raw : []).forEach((entry) => {
    byName[entry.metricName] = entry.information ?? []
  })

  const traffic       = byName['Traffic']?.[0] ?? {}
  const totalSessions = num(traffic.totalSessionCount)
  const distinctUsers = num(traffic.distinctUserCount)

  const metrics = EVENT_METRICS.map(({ apiName, key, label }) => {
    const info     = byName[apiName]?.[0] ?? {}
    const sessions = num(info.sessionsCount)
    // Prefer Clarity's own percentage when present; fall back to computing it
    const rate = info.sessionsWithMetricPercentage != null
      ? num(info.sessionsWithMetricPercentage)
      : totalSessions > 0 ? (sessions / totalSessions) * 100 : 0
    return { key, label, sessions, rate }
  })

  return {
    window: 'Last 3 days',
    totalSessions,
    distinctUsers,
    metrics,
    fetchedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const token = process.env.CLARITY_API_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'CLARITY_API_TOKEN environment variable is not set.' },
      { status: 501 },
    )
  }

  if (cache.payload && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload, {
      headers: { 'Cache-Control': 's-maxage=43200, stale-while-revalidate=86400' },
    })
  }

  try {
    const res = await fetch(CLARITY_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Rate-limited or upstream error: serve stale data if we have any
      if (cache.payload) {
        return NextResponse.json(cache.payload, {
          headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
        })
      }
      const detail = res.status === 401 || res.status === 403
        ? 'Clarity rejected the API token — regenerate it in Clarity Settings → Data Export.'
        : res.status === 429
          ? 'Clarity daily request limit reached (10/day) — data will return after the limit resets.'
          : `Clarity API returned ${res.status}.`
      return NextResponse.json({ error: detail }, { status: 502 })
    }

    const payload = buildPayload(await res.json())
    cache = { at: Date.now(), payload }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=43200, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[Clarity] API error:', err)
    if (cache.payload) return NextResponse.json(cache.payload)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
