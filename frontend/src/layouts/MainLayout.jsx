import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ToastContainer from '../components/ToastContainer'
import { useTaskPolling } from '../hooks/useTaskPolling'

/**
 * Starts background task polling for volunteers.
 * Rendered inside MainLayout so it's active on every protected page.
 */
function TaskPollingGate() {
  useTaskPolling()
  return null
}

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Background polling — fires toasts when new tasks are assigned */}
      <TaskPollingGate />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} Karuna — Connecting communities with volunteers
      </footer>

      {/* Toast overlay — rendered outside main so it's always on top */}
      <ToastContainer />
    </div>
  )
}
