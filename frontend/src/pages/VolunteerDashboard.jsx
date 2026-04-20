import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyTasks, updateIssueStatus } from '../api/issues'
import { useFetch } from '../hooks/useFetch'
import { useNotify } from '../context/NotificationContext'
import PriorityBadge from '../components/PriorityBadge'
import { SkeletonTaskCard } from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  assigned:  'bg-blue-100   text-blue-700',
  completed: 'bg-green-100  text-green-700',
}

const CATEGORY_STYLES = {
  food:      'bg-orange-50 text-orange-600',
  shelter:   'bg-sky-50    text-sky-600',
  medical:   'bg-rose-50   text-rose-600',
  education: 'bg-violet-50 text-violet-600',
  other:     'bg-gray-50   text-gray-500',
}

function CategoryPill({ category }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other}`}>
      {category}
    </span>
  )
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ issue, onAction }) {
  const [actionLoading, setActionLoading] = useState(null) // 'complete' | 'reject'
  const [actionError,   setActionError]   = useState('')

  async function handleAction(newStatus, actionKey) {
    setActionError('')
    setActionLoading(actionKey)
    try {
      await onAction(issue._id, newStatus)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const isAssigned  = issue.status === 'assigned'
  const isCompleted = issue.status === 'completed'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 transition-opacity ${isCompleted ? 'opacity-70' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">{issue.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{issue.description}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[issue.status]}`}>
          {issue.status}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <CategoryPill category={issue.category} />
        <PriorityBadge score={issue.priorityScore ?? 0} showValue />
        {issue.location && (
          <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
            📍 {issue.location.lat.toFixed(3)}, {issue.location.lng.toFixed(3)}
          </span>
        )}
        <span className="ml-auto text-gray-400">
          {new Date(issue.createdAt).toLocaleDateString(undefined, {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      </div>

      {/* ML keywords (if available) */}
      {issue.mlAnalysis?.analyzed && issue.mlAnalysis.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.mlAnalysis.keywords.slice(0, 6).map((kw) => (
            <span key={kw} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{actionError}</p>
      )}

      {/* Actions */}
      {isAssigned && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleAction('completed', 'complete')}
            disabled={!!actionLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {actionLoading === 'complete' ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Mark Complete
          </button>

          <button
            onClick={() => handleAction('pending', 'reject')}
            disabled={!!actionLoading}
            className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {actionLoading === 'reject' ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Reject Task
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium pt-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Task completed
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VolunteerDashboard() {
  const { token, user } = useAuth()
  const notify = useNotify()
  const [filter, setFilter] = useState('all') // 'all' | 'assigned' | 'completed'

  const fetchTasks = useCallback((signal) => getMyTasks(token, signal), [token])
  const { data: tasks, loading, error, refetch } = useFetch(fetchTasks, [token])

  async function handleAction(issueId, newStatus) {
    await updateIssueStatus(issueId, newStatus, token)
    if (newStatus === 'completed') {
      notify('✅ Task marked as completed!', 'success')
    } else if (newStatus === 'pending') {
      notify('↩️ Task rejected and returned to pending.', 'warning')
    }
    refetch()
  }

  const filtered = tasks
    ? tasks.filter(t => filter === 'all' || t.status === filter)
    : []

  const counts = tasks
    ? {
        all:       tasks.length,
        assigned:  tasks.filter(t => t.status === 'assigned').length,
        completed: tasks.filter(t => t.status === 'completed').length,
      }
    : { all: 0, assigned: 0, completed: 0 }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.name ? `${user.name}'s Tasks` : 'My Tasks'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Issues assigned to you — accept, complete, or reject them here.
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

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: 'All Tasks'  },
          { key: 'assigned',  label: 'Active'     },
          { key: 'completed', label: 'Completed'  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              filter === key
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === key ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonTaskCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorMessage message={error} onRetry={refetch} />}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">
            {filter === 'all'
              ? 'No tasks assigned to you yet.'
              : `No ${filter} tasks.`}
          </p>
          <p className="text-xs text-gray-400">Tasks will appear here once an admin assigns them to you.</p>
        </div>
      )}

      {/* Task cards grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue) => (
            <TaskCard key={issue._id} issue={issue} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
