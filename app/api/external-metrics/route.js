import { NextResponse } from 'next/server'
import { createPrivateKey, createSign } from 'node:crypto'
import { gunzip } from 'node:zlib'
import { promisify } from 'node:util'

export const dynamic = 'force-dynamic'

const gunzipAsync = promisify(gunzip)

// ── Microsoft Clarity ──────────────────────────────────────────────────────
// Token generated in Clarity → Settings → Data Export → Generate New API Token
async function fetchClarityData() {
  const apiToken = process.env.CLARITY_API_TOKEN
  if (!apiToken) return { configured: false }

  // Data Export API: supports numOfDays = 1, 2, or 3
  const res = await fetch(
    'https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3',
    { headers: { Authorization: `Bearer ${apiToken}` } }
  )
  if (!res.ok) throw new Error(`Clarity API ${res.status}: ${await res.text()}`)

  const data = await res.json()

  // Response is an array of metric objects: [{ metricName, information: [...] }]
  // Find total session count and JS error count across all metrics
  let totalSessions = 0
  let jsErrors      = 0

  const metrics = Array.isArray(data) ? data : (data.metrics ?? [])
  for (const item of metrics) {
    const name = (item.metricName ?? '').toLowerCase()
    const info = Array.isArray(item.information) ? item.information[0] : item

    if (name.includes('session') || name === '') {
      totalSessions = info?.totalSessionCount ?? info?.sessionCount ?? totalSessions
    }
    if (name.includes('error') || name.includes('jserror')) {
      jsErrors = info?.totalSessionCount ?? info?.sessionCount ?? info?.errorCount ?? jsErrors
    }
  }

  // Fallback: if flat object (single metric row)
  if (totalSessions === 0 && !Array.isArray(data)) {
    totalSessions = data.totalSessionCount ?? data.sessionCount ?? 0
    jsErrors      = data.jsErrorCount      ?? data.errorCount   ?? 0
  }

  return {
    configured:    true,
    errorRate:     totalSessions > 0 ? (jsErrors / totalSessions) * 100 : 0,
    jsErrors,
    totalSessions,
    raw:           metrics.map((m) => m.metricName), // helps debug available metric names
  }
}

// ── Google Play Console ────────────────────────────────────────────────────
async function fetchPlayData() {
  const credJson    = process.env.PLAY_CONSOLE_CREDENTIALS_JSON
  const packageName = process.env.PLAY_CONSOLE_PACKAGE_NAME
  if (!credJson || !packageName) return { configured: false }

  const { GoogleAuth } = require('google-auth-library')
  const auth   = new GoogleAuth({
    credentials: JSON.parse(credJson),
    scopes: ['https://www.googleapis.com/auth/playdeveloperreporting'],
  })
  const client    = await auth.getClient()
  const { token } = await client.getAccessToken()

  const end   = new Date(); end.setDate(end.getDate() - 1)
  const start = new Date(end); start.setDate(start.getDate() - 29)
  const toDateObj = (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })

  const res = await fetch(
    `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${encodeURIComponent(packageName)}/storePerformanceMetricSet:query`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        timeline: {
          aggregationPeriod: 'FULL_RANGE',
          startDate: toDateObj(start),
          endDate:   toDateObj(end),
        },
        dimensions: [],
        metrics:    ['storeListingConversions'],
      }),
    }
  )
  if (!res.ok) throw new Error(`Play Console API ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const row  = data.rows?.[0]

  // API returns metrics either as a map or as an array — handle both
  let installs = 0
  if (row?.metrics?.storeListingConversions) {
    installs = parseInt(row.metrics.storeListingConversions.decimalValue ?? '0', 10)
  } else if (Array.isArray(row?.metrics)) {
    const m = row.metrics.find((m) => m.metric === 'storeListingConversions')
    installs = parseInt(m?.decimal128Value?.value ?? m?.decimalValue ?? '0', 10)
  }

  return { configured: true, installs }
}

// ── App Store Connect ──────────────────────────────────────────────────────
function signAppStoreJWT(keyId, issuerId, privateKeyPem) {
  const now     = Math.floor(Date.now() / 1000)
  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url')
  const input   = `${header}.${payload}`
  const signer  = createSign('SHA256')
  signer.update(input)
  const sig = signer
    .sign({ key: createPrivateKey(privateKeyPem.replace(/\\n/g, '\n')), dsaEncoding: 'ieee-p1363' })
    .toString('base64url')
  return `${input}.${sig}`
}

async function fetchAppStoreData() {
  const keyId        = process.env.APP_STORE_KEY_ID
  const issuerId     = process.env.APP_STORE_ISSUER_ID
  const privateKey   = process.env.APP_STORE_PRIVATE_KEY
  const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER
  if (!keyId || !issuerId || !privateKey || !vendorNumber) return { configured: false }

  const jwt = signAppStoreJWT(keyId, issuerId, privateKey)

  // Use most recent completed monthly report (previous month)
  const d = new Date(); d.setDate(0) // last day of prev month
  const reportDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const res = await fetch(
    `https://api.appstoreconnect.apple.com/v1/salesReports?` +
    `filter[frequency]=MONTHLY&filter[reportDate]=${reportDate}&` +
    `filter[reportType]=SALES&filter[reportSubType]=SUMMARY&` +
    `filter[vendorNumber]=${vendorNumber}`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  )
  if (!res.ok) throw new Error(`App Store API ${res.status}: ${await res.text()}`)

  // Response is gzip-compressed TSV
  const buf  = Buffer.from(await res.arrayBuffer())
  const text = (await gunzipAsync(buf)).toString('utf-8')

  const [headerLine, ...rows] = text.trim().split('\n')
  const headers = headerLine.split('\t')
  const typeIdx = headers.indexOf('Product Type Identifier')
  const unitIdx = headers.indexOf('Units')

  let installs = 0
  for (const line of rows) {
    const cols = line.split('\t')
    const type = cols[typeIdx] ?? ''
    // Exclude re-downloads (contain '7') and refunds (start with '-')
    if (type && !type.includes('7') && !cols[unitIdx]?.startsWith('-')) {
      installs += parseInt(cols[unitIdx] || '0', 10)
    }
  }
  return { configured: true, installs, period: reportDate }
}

// ── Handler ────────────────────────────────────────────────────────────────
export async function GET() {
  const [c, p, a] = await Promise.allSettled([
    fetchClarityData(),
    fetchPlayData(),
    fetchAppStoreData(),
  ])

  function settle(result, label) {
    if (result.status === 'fulfilled') return result.value
    console.error(`[external-metrics] ${label}:`, result.reason?.message)
    return { configured: true, error: result.reason?.message }
  }

  return NextResponse.json({
    clarity:  settle(c, 'Clarity'),
    play:     settle(p, 'Play'),
    appStore: settle(a, 'AppStore'),
  })
}
