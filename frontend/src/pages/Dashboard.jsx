import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getIssues } from '../api/issues'
import { useFetch } from '../hooks/useFetch'
import PriorityBadge from '../components/PriorityBadge'
import { SkeletonDashboard } from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  assigned:  'bg-blue-100   text-blue-700',
  completed: 'bg-green-100  text-green-700',
}

const roleDescriptions = {
  admin:     'You have full administrative access.',
  volunteer: 'You can be assigned to community issues.',
  user:      'You can report and track community issues.',
}

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${color} p-5`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuth()

  const { data: issues, loading, error, refetch } = useFetch(
    (signal) => getIssues(token, signal),
    [token]
  )

  if (loading) return <SkeletonDashboard />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  const sorted = [...(issues ?? [])].sort(
    (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
  )

  const stats = [
    { label: 'Pending',   value: issues.filter(i => i.status === 'pending').length,   color: 'border-yellow-400'  },
    { label: 'Assigned',  value: issues.filter(i => i.status === 'assigned').length,  color: 'border-blue-400'    },
    { label: 'Completed', value: issues.filter(i => i.status === 'completed').length, color: 'border-green-400'   },
    { label: 'Total',     value: issues.length,                                        color: 'border-emerald-400' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.name ? `Welcome, ${user.name}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {roleDescriptions[user?.role] ?? 'Overview of community issues and volunteer activity'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/issues/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Report Issue
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Issues table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">Recent Issues</h2>
          <span className="text-xs text-gray-400">Top 10 by priority</span>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0A9 9 0 013 12z" />
            </svg>
            <p className="text-sm">No issues yet. Be the first to report one.</p>
            <Link to="/issues/new" className="text-sm text-emerald-600 hover:underline font-medium">
              Report an issue →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Priority</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 10).map((issue) => (
                  <tr key={issue._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 max-w-xs truncate">
                      {issue.title}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 capitalize">{issue.category}</td>
                    <td className="py-3 px-4">
                      <PriorityBadge score={issue.priorityScore ?? 0} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[issue.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {issue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
