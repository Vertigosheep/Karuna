import { createContext, useContext, useState, useCallback, useRef } from 'react'

/**
 * @typedef {{ id: number, message: string, type: 'success'|'error'|'info'|'warning' }} Toast
 */

const NotificationContext = createContext(null)

let _nextId = 1

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {Toast[]} */ ([]))
  const timers = useRef({})

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} [type='info']
   * @param {number} [duration=4000] ms before auto-dismiss
   */
  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = _nextId++
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      timers.current[id] = setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ toasts, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used inside <NotificationProvider>')
  return ctx.notify
}

export function useToasts() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useToasts must be used inside <NotificationProvider>')
  return { toasts: ctx.toasts, dismiss: ctx.dismiss }
}
