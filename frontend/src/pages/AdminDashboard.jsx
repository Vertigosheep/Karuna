import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getIssues } from '../api/issues'
import { useFetch } from '../hooks/useFetch'
import PriorityBadge, { priorityTier } from '../components/PriorityBadge'

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  assigned:  'bg-blue-100   text-blue-700',
  completed: 'bg-green-100  text-green-700',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Category pill ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES = {
  food:      'bg-orange-50  text-orange-600',
  shelter:   'bg-sky-50     text-sky-600',
  medical:   'bg-rose-50    text-rose-600',
  education: 'bg-violet-50  text-violet-600',
  other:     'bg-gray-50    text-gray-500',
}

function CategoryPill({ category }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other}`}>
      {category}
    </span>
  )
}

// ── Row highlight by priority tier ───────────────────────────────────────────

const ROW_HIGHLIGHT = {
  high:   'border-l-4 border-red-400',
  medium: 'border-l-4 border-yellow-400',
  low:    'border-l-4 border-green-400',
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${color} p-5`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const TIER_OPTIONS   = ['all', 'high', 'medium', 'low']
const STATUS_OPTIONS = ['all', 'pending', 'assigned', 'completed']

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { token } = useAuth()

  const { data: issues, loading, error, refetch } = useFetch(
    (signal) => getIssues(token, signal),
    [token]
  )

  const [tierFilter,   setTierFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,       setSearch]       = useState('')

  // Sort descending by priorityScore, then filter
  const sorted = useMemo(() => {
    if (!issues) return []
    return [...issues].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
  }, [issues])

  const filtered = useMemo(() => {
    return sorted.filter((issue) => {
      const tier   = priorityTier(issue.priorityScore ?? 0)
      const matchT = tierFilter   === 'all' || tier === tierFilter
      const matchS = statusFilter === 'all' || issue.status === statusFilter
      const matchQ = !search || issue.title.toLowerCase().includes(search.toLowerCase())
      return matchT && matchS && matchQ
    })
  }, [sorted, tierFilter, statusFilter, search])

  // Derived stats
  const stats = useMemo(() => {
    if (!issues) return null
    return {
      total:     issues.length,
      pending:   issues.filter(i => i.status === 'pending').length,
      assigned:  issues.filter(i => i.status === 'assigned').length,
      completed: issues.filter(i => i.status === 'completed').length,
      high:      issues.filter(i => priorityTier(i.priorityScore ?? 0) === 'high').length,
    }
  }, [issues])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">All community issues sorted by priority score</p>
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

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Issues"     value={stats.total}     color="border-gray-300"    />
          <StatCard label="Pending"          value={stats.pending}   color="border-yellow-400"  />
          <StatCard label="Assigned"         value={stats.assigned}  color="border-blue-400"    />
          <StatCard label="Completed"        value={stats.completed} color="border-green-400"   />
          <StatCard label="High Priority"    value={stats.high}      color="border-red-400"     />
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Priority tier filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Priority:</span>
          <div className="flex gap-1">
            {TIER_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  tierFilter === t
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Status:</span>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map(s => (
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

        {/* Result count */}
        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
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
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button onClick={refetch} className="text-sm text-emerald-600 hover:underline">Try again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0A9 9 0 013 12z" />
            </svg>
            <p className="text-sm">No issues match the current filters.</p>
          </div>
        )}

        {/* Data table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-4 text-left w-8">#</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Priority</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Location</th>
                  <th className="py-3 px-4 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue, idx) => {
                  const tier = priorityTier(issue.priorityScore ?? 0)
                  return (
                    <tr
                      key={issue._id}
                      className={`${ROW_HIGHLIGHT[tier]} hover:bg-gray-50 transition-colors`}
                    >
                      <td className="py-3 px-4 text-xs text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-800 max-w-xs truncate">{issue.title}</p>
                        {issue.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{issue.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <CategoryPill category={issue.category} />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge score={issue.priorityScore ?? 0} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {issue.location
                          ? `${issue.location.lat.toFixed(3)}, ${issue.location.lng.toFixed(3)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(issue.createdAt).toLocaleDateString(undefined, {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
