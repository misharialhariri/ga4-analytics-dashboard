'use client'

const DEVICE_CONFIG = {
  mobile:  { icon: '📱', color: '#6366f1' },
  desktop: { icon: '💻', color: '#06b6d4' },
  tablet:  { icon: '📋', color: '#f59e0b' },
}

function StatBox({ label, value, sub, colorClass }) {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl ${colorClass}`}>
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value.toLocaleString()}</span>
      {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
    </div>
  )
}

export default function AbandonedCartsWidget({ data }) {
  if (!data || data.addToCarts === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Abandoned Carts</h3>
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
          <span className="text-3xl">🛒</span>
          <p className="text-sm text-gray-400">No ecommerce data for this period</p>
          <p className="text-xs text-gray-300">Enable ecommerce tracking in GA4 to see cart data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Abandoned Carts</h3>
        <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          {data.abandonedRate.toFixed(1)}% abandoned
        </span>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <StatBox label="Add to Cart"  value={data.addToCarts} colorClass="bg-[#eef0fb]" />
        <StatBox label="Checkouts"    value={data.checkouts}  colorClass="bg-cyan-50" />
        <StatBox label="Purchases"    value={data.purchases}  colorClass="bg-emerald-50" />
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50">
          <span className="text-xs text-gray-500 mb-1">Abandoned</span>
          <span className="text-xl font-bold text-red-500">{data.abandoned.toLocaleString()}</span>
          <span className="text-xs text-red-400">{data.abandonedRate.toFixed(1)}% rate</span>
        </div>
      </div>

      {/* Per-device breakdown */}
      {data.perDevice.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Abandoned by device
          </p>
          <div className="space-y-3">
            {data.perDevice.map((d) => {
              const cfg   = DEVICE_CONFIG[d.device] || { icon: '📱', color: '#94a3b8' }
              const pct   = Math.min(d.abandonedRate, 100)
              return (
                <div key={d.device} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center leading-none">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-700 capitalize">{d.device}</span>
                      <span className="text-gray-400 tabular-nums">
                        {d.abandoned.toLocaleString()} abandoned &middot; {d.abandonedRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
