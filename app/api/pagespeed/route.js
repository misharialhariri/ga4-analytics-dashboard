import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache for 1 hour

const TARGET_URL = 'https://saco.sa/'

async function fetchStrategy(strategy) {
  const key = process.env.PAGESPEED_API_KEY
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(TARGET_URL)}&strategy=${strategy}` +
    (key ? `&key=${key}` : '')

  const res = await fetch(endpoint, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`PageSpeed API ${res.status}: ${await res.text()}`)
  const data = await res.json()

  const score  = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100)
  const audits = data.lighthouseResult?.audits ?? {}
  const cwv    = data.loadingExperience?.metrics ?? {}

  // Helper: extract field data metric
  function field(key, scale = 1, decimals = 1) {
    const m = cwv[key]
    if (!m) return null
    return {
      value:    (m.percentile / scale).toFixed(decimals),
      category: m.category, // 'FAST' | 'AVERAGE' | 'SLOW'
    }
  }

  return {
    score,
    lab: {
      lcp: audits['largest-contentful-paint']?.displayValue  ?? null,
      fcp: audits['first-contentful-paint']?.displayValue    ?? null,
      tbt: audits['total-blocking-time']?.displayValue       ?? null,
      cls: audits['cumulative-layout-shift']?.displayValue   ?? null,
      si:  audits['speed-index']?.displayValue               ?? null,
      tti: audits['interactive']?.displayValue               ?? null,
      // numeric scores (0–1) for colour-coding lab metrics
      lcpScore: audits['largest-contentful-paint']?.score ?? null,
      fcpScore: audits['first-contentful-paint']?.score   ?? null,
      tbtScore: audits['total-blocking-time']?.score      ?? null,
      clsScore: audits['cumulative-layout-shift']?.score  ?? null,
      siScore:  audits['speed-index']?.score              ?? null,
    },
    field: {
      lcp: field('LARGEST_CONTENTFUL_PAINT_MS', 1000),
      cls: field('CUMULATIVE_LAYOUT_SHIFT_SCORE', 100, 2),
      inp: field('INTERACTION_TO_NEXT_PAINT', 1, 0),
      fcp: field('FIRST_CONTENTFUL_PAINT_MS', 1000),
      ttfb: field('EXPERIMENTAL_TIME_TO_FIRST_BYTE', 1, 0),
    },
    fetchedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const [mobile, desktop] = await Promise.allSettled([
    fetchStrategy('mobile'),
    fetchStrategy('desktop'),
  ])

  function settle(result, label) {
    if (result.status === 'fulfilled') return result.value
    console.error(`[pagespeed] ${label}:`, result.reason?.message)
    return { error: result.reason?.message }
  }

  return NextResponse.json({
    url:     TARGET_URL,
    mobile:  settle(mobile,  'mobile'),
    desktop: settle(desktop, 'desktop'),
  })
}
