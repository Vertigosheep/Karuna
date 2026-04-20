import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getIssues } from '../api/issues'
import { useFetch } from '../hooks/useFetch'
import IssueMap from '../components/IssueMap'
import { priorityTier } from '../components/PriorityBadge'

const TIER_DOT = {
  high:   'bg-red-500',
  medium: 'bg-yellow-400',
  low:    'bg-green-500',
}

export default function IssueMapPage() {
  const { token } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchIssues = useCallback((signal) => getIssues(token, signal), [token])
  const { data: issues, loading, error, refetch } = useFetch(fetchIssues, [token])

  const filtered = issues
    ? issues.filter((i) =>
        statusFilter === 'all' || i.status === statusFilter
      )
    : []

  // Derived counts
  const counts = issues
    ? {
        total:  issues.length,
        high:   issues.filter((i) => priorityTier(i.priorityScore ?? 0) === 'high').length,
        medium: issues.filter((i) => priorityTier(i.priorityScore ?? 0) === 'medium').length,
        low:    issues.filter((i) => priorityTier(i.priorityScore ?? 0) === 'low').length,
      }
    : null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Issue Map</h1>
          <p className="text-sm text-gray-500 mt-1">
            Geographic overview of all reported community issues
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Legend + stats */}
      {counts && (
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-6">
          <span className="text-sm font-semibold text-gray-600">
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''} shown
          </span>
          <div className="flex flex-wrap gap-4">
            {[
              { tier: 'high',   label: 'High',   count: counts.high   },
              { tier: 'medium', label: 'Medium', count: counts.medium },
              { tier: 'low',    label: 'Low',    count: counts.low    },
            ].map(({ tier, label, count }) => (
              <div key={tier} className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className={`w-3 h-3 rounded-full ${TIER_DOT[tier]}`} />
                <span className="font-medium">{label}</span>
                <span className="text-gray-400">({count})</span>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Filter:</span>
            {['all', 'pending', 'assigned', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Loading issues…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={refetch} className="text-sm text-emerald-600 hover:underline">Try again</button>
        </div>
      )}

      {/* Map */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-sm">No issues to display on the map.</p>
            </div>
          ) : (
            <IssueMap issues={filtered} height="560px" />
          )}
        </>
      )}

      {/* Issues without location warning */}
      {!loading && !error && issues && (
        (() => {
          const noLoc = issues.filter((i) => !i.location?.lat && !i.location?.lng).length
          return noLoc > 0 ? (
            <p className="text-xs text-gray-400 text-center">
              {noLoc} issue{noLoc !== 1 ? 's' : ''} without location data not shown on map.
            </p>
          ) : null
        })()
      )}
    </div>
  )
}
