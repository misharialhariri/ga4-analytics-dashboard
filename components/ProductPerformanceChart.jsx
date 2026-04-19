'use client'

const SACO_NAVY = '#1B2965'

function fmt(n) {
  if (n >= 1_000_000) return `SAR ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `SAR ${(n / 1_000).toFixed(1)}K`
  return `SAR ${n.toFixed(2)}`
}

export default function ProductPerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Performance</h3>
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
          <span className="text-3xl">📦</span>
          <p className="text-sm text-gray-400">No product data for this period</p>
          <p className="text-xs text-gray-300">Enable ecommerce item tracking in GA4 to see product data</p>
        </div>
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Product Performance</h3>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
        <span className="col-span-5">Product</span>
        <span className="col-span-3 text-right">Revenue</span>
        <span className="col-span-2 text-right">Purchases</span>
        <span className="col-span-2 text-right">Add to Cart</span>
      </div>

      <div className="space-y-3">
        {data.map((product, i) => {
          const barPct = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0
          return (
            <div key={product.name}>
              <div className="grid grid-cols-12 gap-2 items-center text-sm px-1 mb-1.5">
                {/* Rank + name */}
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold tabular-nums w-5 flex-shrink-0"
                    style={{ color: i === 0 ? SACO_NAVY : '#9ca3af' }}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-700 truncate" title={product.name}>
                    {product.name}
                  </span>
                </div>
                {/* Revenue */}
                <span className="col-span-3 text-right text-xs font-semibold tabular-nums text-gray-800">
                  {fmt(product.revenue)}
                </span>
                {/* Purchases */}
                <span className="col-span-2 text-right text-xs tabular-nums text-gray-500">
                  {product.purchases.toLocaleString()}
                </span>
                {/* Add to carts */}
                <span className="col-span-2 text-right text-xs tabular-nums text-gray-400">
                  {product.addToCarts.toLocaleString()}
                </span>
              </div>
              {/* Revenue bar */}
              <div className="w-full bg-gray-100 rounded-full h-1 mx-1">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: SACO_NAVY, opacity: 1 - i * 0.07 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
