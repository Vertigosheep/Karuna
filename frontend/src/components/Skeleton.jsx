/**
 * Reusable skeleton loading components.
 * All use a pulse animation via Tailwind's `animate-pulse`.
 */

/** Single skeleton line */
export function SkeletonLine({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  )
}

/** Skeleton stat card — matches StatCard dimensions */
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-gray-200 p-5 space-y-3">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-8 w-12" />
    </div>
  )
}

/** Skeleton table row */
export function SkeletonTableRow({ cols = 4 }) {
  const widths = ['w-48', 'w-20', 'w-24', 'w-16', 'w-20']
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <SkeletonLine className={`h-4 ${widths[i % widths.length]}`} />
        </td>
      ))}
    </tr>
  )
}

/** Skeleton task card — matches TaskCard dimensions */
export function SkeletonTaskCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-2/3" />
        </div>
        <SkeletonLine className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine className="h-5 w-16 rounded-full" />
        <SkeletonLine className="h-5 w-24 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <SkeletonLine className="h-9 flex-1 rounded-lg" />
        <SkeletonLine className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

/** Full-page skeleton for dashboard stats + table */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-56" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <SkeletonLine className="h-4 w-32" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={4} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
