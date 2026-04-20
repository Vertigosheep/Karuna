import { useEffect, useRef } from 'react'
import { getMyTasks } from '../api/issues'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotificationContext'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Polls GET /api/issues/my-tasks every 30 seconds for volunteer users.
 * Fires a toast notification when a new assigned task is detected.
 *
 * @param {{ enabled?: boolean }} options
 */
export function useTaskPolling({ enabled = true } = {}) {
  const { token, user } = useAuth()
  const notify = useNotify()

  // Track the set of issue IDs we've already seen as 'assigned'
  const seenAssignedIds = useRef(null)

  useEffect(() => {
    // Only poll for volunteers (and admins who may also have tasks)
    if (!enabled || !token || !['volunteer', 'admin'].includes(user?.role)) return

    async function poll() {
      try {
        const tasks = await getMyTasks(token)
        const currentAssigned = tasks.filter((t) => t.status === 'assigned')

        if (seenAssignedIds.current === null) {
          // First load — seed the set without notifying
          seenAssignedIds.current = new Set(currentAssigned.map((t) => t._id))
          return
        }

        // Find tasks that are newly assigned since last poll
        const newTasks = currentAssigned.filter(
          (t) => !seenAssignedIds.current.has(t._id)
        )

        newTasks.forEach((task) => {
          seenAssignedIds.current.add(task._id)
          notify(
            `📋 New task assigned: "${task.title}"`,
            'info',
            6000
          )
        })
      } catch {
        // Silently ignore polling errors — don't spam the user
      }
    }

    // Run immediately, then on interval
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      clearInterval(id)
      seenAssignedIds.current = null
    }
  }, [enabled, token, user?.role, notify])
}
