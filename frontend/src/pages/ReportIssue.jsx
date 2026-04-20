import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotificationContext'
import { createIssue } from '../api/issues'

const CATEGORIES = ['food', 'shelter', 'medical', 'education', 'other']

const INITIAL_FORM = {
  title:       '',
  description: '',
  category:    'other',
  lat:         '',
  lng:         '',
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export default function ReportIssue() {
  const { token } = useAuth()
  const notify = useNotify()
  const navigate = useNavigate()

  const [form, setForm]         = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(null) // holds the created issue on success
  const [locating, setLocating] = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  function handleChange(e) {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    setFieldErrors((prev) => ({ ...prev, [id]: '' }))
    setError('')
  }

  function validate() {
    const errs = {}
    if (!form.title.trim())       errs.title       = 'Title is required.'
    if (!form.description.trim()) errs.description = 'Description is required.'
    if (!form.category)           errs.category    = 'Category is required.'

    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (form.lat === '' || isNaN(lat) || lat < -90  || lat > 90)
      errs.lat = 'Enter a valid latitude (−90 to 90).'
    if (form.lng === '' || isNaN(lng) || lng < -180 || lng > 180)
      errs.lng = 'Enter a valid longitude (−180 to 180).'

    return errs
  }

  // ── Geolocation ──────────────────────────────────────────────────────────

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
        }))
        setFieldErrors((prev) => ({ ...prev, lat: '', lng: '' }))
        setLocating(false)
      },
      () => {
        setError('Could not detect location. Please enter coordinates manually.')
        setLocating(false)
      }
    )
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(null)

    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        location: {
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
        },
      }
      const created = await createIssue(payload, token)
      setSuccess(created)
      setForm(INITIAL_FORM)
      notify('🎉 Issue reported successfully!', 'success')
    } catch (err) {
      setError(err.message)
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center space-y-4">
          {/* Checkmark icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800">Issue reported!</h2>
          <p className="text-sm text-gray-500">
            Your issue has been submitted and will be reviewed shortly.
          </p>

          {/* Issue summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1">
            <p><span className="font-medium text-gray-600">Title:</span> {success.title}</p>
            <p><span className="font-medium text-gray-600">Category:</span> <span className="capitalize">{success.category}</span></p>
            <p><span className="font-medium text-gray-600">Priority score:</span> {success.priorityScore?.toFixed(4) ?? '—'}</p>
            <p><span className="font-medium text-gray-600">Status:</span> <span className="capitalize">{success.status}</span></p>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => setSuccess(null)}
              className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Report another
            </button>
            <Link
              to="/dashboard"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto">
      {/* Back link */}
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline mb-6">
        ← Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Report an Issue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe the community need so volunteers can be assigned.
          </p>
        </div>

        {/* Global error banner */}
        {error && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Food shortage in district 4"
              maxLength={120}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                fieldErrors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <FieldError message={fieldErrors.title} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the situation in detail…"
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                fieldErrors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <FieldError message={fieldErrors.description} />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
            <FieldError message={fieldErrors.category} />
          </div>

          {/* Location */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </legend>

            {/* Detect button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-600 border border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {locating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Detecting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                  </svg>
                  Use my location
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lat" className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={handleChange}
                  placeholder="e.g. 40.7128"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.lat ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <FieldError message={fieldErrors.lat} />
              </div>
              <div>
                <label htmlFor="lng" className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={handleChange}
                  placeholder="e.g. -74.0060"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.lng ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <FieldError message={fieldErrors.lng} />
              </div>
            </div>
          </fieldset>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting…
              </>
            ) : (
              'Submit Issue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
