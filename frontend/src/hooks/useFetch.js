import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic data-fetching hook with AbortController support.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {any[]} [deps=[]]
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const abortRef = useRef(null)

  const run = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError('')
    try {
      const result = await fetcher(controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return () => abortRef.current?.abort()
  }, [run])

  return { data, loading, error, refetch: run }
}
