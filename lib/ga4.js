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

async function runReport({ startDate, endDate, dimensions = [], metrics = [], orderBys = [], limit = 100 }) {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error('GA4_PROPERTY_ID environment variable is not set.')

  const [response] = await getClient().runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions,
    metrics,
    ...(orderBys.length ? { orderBys } : {}),
    ...(limit ? { limit } : {}),
  })
  return response
}

module.exports = { runReport }
