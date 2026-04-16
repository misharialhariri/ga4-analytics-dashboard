const { BetaAnalyticsDataClient } = require('@google-analytics/data')
const path = require('path')

const propertyId = process.env.GA4_PROPERTY_ID

if (!propertyId) {
  throw new Error('GA4_PROPERTY_ID environment variable is not set.')
}

// Supports two auth strategies:
// 1. File-based (local): set GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
// 2. Env-based (production): set GOOGLE_CREDENTIALS_JSON=<full json string>
function buildClientOptions() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    return { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) }
  }
  const keyFilename = path.resolve(process.cwd(), 'credentials.json')
  return { keyFilename }
}

const analyticsDataClient = new BetaAnalyticsDataClient(buildClientOptions())

/**
 * Run a GA4 runReport call.
 * @param {object} opts
 * @param {string} opts.startDate  e.g. "30daysAgo" or "2024-01-01"
 * @param {string} opts.endDate    e.g. "today" or "2024-01-31"
 * @param {Array}  opts.dimensions e.g. [{ name: 'date' }]
 * @param {Array}  opts.metrics    e.g. [{ name: 'sessions' }]
 * @param {Array}  [opts.orderBys]
 * @param {number} [opts.limit]
 */
async function runReport({ startDate, endDate, dimensions = [], metrics = [], orderBys = [], limit = 100 }) {
  const [response] = await analyticsDataClient.runReport({
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
