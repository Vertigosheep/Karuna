import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleLabels = {
  admin:     'Admin',
  volunteer: 'Volunteer',
  user:      'Member',
}

const roleBadgeColors = {
  admin:     'bg-purple-100 text-purple-700',
  volunteer: 'bg-blue-100 text-blue-700',
  user:      'bg-gray-100 text-gray-600',
}

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-emerald-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold tracking-wide hover:text-emerald-200 transition-colors">
          Karuna
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4 text-sm font-medium">
          {isLoggedIn ? (
            <>
              {/* User info + role badge */}
              <div className="flex items-center gap-2">
                {user?.name && (
                  <span className="text-emerald-100 hidden sm:inline">
                    {user.name}
                  </span>
                )}
                {user?.role && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeColors[user.role] ?? roleBadgeColors.user}`}>
                    {roleLabels[user.role] ?? user.role}
                  </span>
                )}
              </div>

              <Link
                to="/dashboard"
                className="hover:text-emerald-200 transition-colors"
              >
                Dashboard
              </Link>

              <Link
                to="/map"
                className="hover:text-emerald-200 transition-colors"
              >
                Map
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hover:text-emerald-200 transition-colors"
                >
                  Admin
                </Link>
              )}

              {(user?.role === 'volunteer' || user?.role === 'admin') && (
                <Link
                  to="/volunteer"
                  className="hover:text-emerald-200 transition-colors"
                >
                  My Tasks
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-white text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-emerald-200 transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
