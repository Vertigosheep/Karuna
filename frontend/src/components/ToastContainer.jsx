import { useToasts } from '../context/NotificationContext'

// ── Icon per type ─────────────────────────────────────────────────────────────

function ToastIcon({ type }) {
  if (type === 'success') return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
  if (type === 'error') return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
  if (type === 'warning') return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
  // info (default)
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  )
}

// ── Styles per type ───────────────────────────────────────────────────────────

const TYPE_STYLES = {
  success: 'bg-emerald-600 text-white',
  error:   'bg-red-600    text-white',
  warning: 'bg-yellow-500 text-white',
  info:    'bg-gray-800   text-white',
}

// ── Single toast ──────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg
        min-w-[260px] max-w-sm w-full
        animate-[slideIn_0.2s_ease-out]
        ${TYPE_STYLES[toast.type] ?? TYPE_STYLES.info}
      `}
    >
      <ToastIcon type={toast.type} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Container (fixed overlay, top-right) ─────────────────────────────────────

export default function ToastContainer() {
  const { toasts, dismiss } = useToasts()

  if (!toasts.length) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
