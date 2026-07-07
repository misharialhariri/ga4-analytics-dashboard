const { BetaAnalyticsDataClient } = require('@google-analytics/data')
const path = require('path')

function buildClientOptions() {
  // fallback:'rest' uses HTTP/1.1 instead of gRPC, avoiding OpenSSL 3.x
  // compatibility issues on Vercel's Node.js 18 runtime
  const base = { fallback: 'rest' }
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
    }
    return { ...base, credentials }
  }
  return { ...base, keyFilename: path.resolve(process.cwd(), 'credentials.json') }
}

let _client = null
function getClient() {
  if (!_client) _client = new BetaAnalyticsDataClient(buildClientOptions())
  return _client
}

// GA4 allows only ~10 concurrent Data API requests per property. The overview
// route alone issues 20+ reports in one Promise.all, so every call is gated
// through this semaphore. Kept below the hard limit to leave headroom for
// overlapping requests (auto-refresh, historical pages open in other tabs).
const MAX_CONCURRENT = 8
let activeCount = 0
const waitQueue = []

function acquireSlot() {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++
    return Promise.resolve()
  }
  return new Promise((resolve) => waitQueue.push(resolve))
}

function releaseSlot() {
  const next = waitQueue.shift()
  if (next) next()
  else activeCount--
}

function isConcurrencyError(err) {
  return String(err?.message ?? '').toLowerCase().includes('concurrent')
}

async function runReport({ startDate, endDate, dimensions = [], metrics = [], orderBys = [], limit = 100, dimensionFilter }) {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error('GA4_PROPERTY_ID environment variable is not set.')

  await acquireSlot()
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        const [response] = await getClient().runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate, endDate }],
          dimensions,
          metrics,
          ...(orderBys.length ? { orderBys } : {}),
          ...(limit ? { limit } : {}),
          ...(dimensionFilter ? { dimensionFilter } : {}),
        })
        return response
      } catch (err) {
        // Concurrency quota can still trip when separate serverless instances
        // hit the same property at once — back off and retry a few times.
        if (attempt < 3 && isConcurrencyError(err)) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 250))
          continue
        }
        throw err
      }
    }
  } finally {
    releaseSlot()
  }
}

module.exports = { runReport }
