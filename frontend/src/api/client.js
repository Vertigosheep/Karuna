/**
 * Centralised API client.
 *
 * Features:
 * - Single BASE_URL source of truth
 * - Automatic JSON serialisation / deserialisation
 * - Consistent error messages (uses backend `message` field when available)
 * - AbortSignal support for cancellable requests
 * - 401 → clears localStorage token (stale session handling)
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * @param {string} path
 * @param {RequestInit & { token?: string }} [options]
 */
async function request(path, { token, signal, ...init } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Network error — is the backend running?')
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    // Stale token — clear storage so the user is redirected to login
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    throw new Error(json.message || `Request failed (${res.status})`)
  }

  return json
}

export const api = {
  get:   (path, opts)       => request(path, { method: 'GET',   ...opts }),
  post:  (path, body, opts) => request(path, { method: 'POST',  body: JSON.stringify(body), ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  del:   (path, opts)       => request(path, { method: 'DELETE', ...opts }),
}
