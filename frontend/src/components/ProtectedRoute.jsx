import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route that requires authentication and optionally a specific role.
 *
 * @param {{ children: React.ReactNode, roles?: string[] }} props
 *   roles — if provided, user must have one of these roles or they are redirected to /dashboard
 */
export default function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
