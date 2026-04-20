'use client'

const SACO_NAVY = '#1B2965'

function Card({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
    </div>
  )
}

function NotConfigured() {
  return (
    <div>
      <p className="text-sm text-gray-400">Not configured</p>
      <p className="text-xs text-gray-300 mt-0.5">Add credentials to enable</p>
    </div>
  )
}

function Unavailable({ error }) {
  return (
    <div>
      <p className="text-sm text-red-400">Data unavailable</p>
      {error && <p className="text-xs text-gray-300 mt-0.5 truncate" title={error}>{error}</p>}
    </div>
  )
}

function Value({ value, subtitle }) {
  return (
    <div>
      <p className="text-3xl font-bold tabular-nums mb-1" style={{ color: SACO_NAVY }}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}

export default function ExternalMetricsSection({ clarity, play, appStore, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Clarity Error Rate */}
      <Card icon="⚠️" title="Error Rate · Clarity">
        {loading && !clarity ? <Skeleton /> :
         !clarity?.configured ? <NotConfigured /> :
         clarity?.error ? <Unavailable error={clarity.error} /> :
         <Value
           value={`${clarity.errorRate?.toFixed(2)}%`}
           subtitle={`${clarity.jsErrors?.toLocaleString()} JS errors · ${clarity.totalSessions?.toLocaleString()} sessions`}
         />}
      </Card>

      {/* Google Play Installs */}
      <Card icon="▶" title="Installs · Google Play">
        {loading && !play ? <Skeleton /> :
         !play?.configured ? <NotConfigured /> :
         play?.error ? <Unavailable error={play.error} /> :
         <Value
           value={(play.installs ?? 0).toLocaleString()}
           subtitle="Store listing conversions · last 30 days"
         />}
      </Card>

      {/* App Store Downloads */}
      <Card icon="⬇" title="Downloads · App Store">
        {loading && !appStore ? <Skeleton /> :
         !appStore?.configured ? <NotConfigured /> :
         appStore?.error ? <Unavailable error={appStore.error} /> :
         <Value
           value={(appStore.installs ?? 0).toLocaleString()}
           subtitle={`Monthly downloads · ${appStore.period ?? ''}`}
         />}
      </Card>

    </div>
  )
}
