import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { priorityTier } from './PriorityBadge'

// ── Leaflet default icon fix (Vite asset bundling) ────────────────────────────
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
})

// ── Marker colours by priority tier ──────────────────────────────────────────
const TIER_COLORS = {
  high:   { fill: '#ef4444', stroke: '#b91c1c' }, // red
  medium: { fill: '#f59e0b', stroke: '#b45309' }, // yellow
  low:    { fill: '#22c55e', stroke: '#15803d' }, // green
}

// ── Auto-fit bounds when issues change ───────────────────────────────────────
function FitBounds({ issues }) {
  const map = useMap()
  useEffect(() => {
    const valid = issues.filter(
      (i) => i.location?.lat != null && i.location?.lng != null
    )
    if (!valid.length) return
    const bounds = valid.map((i) => [i.location.lat, i.location.lng])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [issues, map])
  return null
}

// ── Status badge (inline in popup) ───────────────────────────────────────────
const STATUS_STYLES = {
  pending:   'background:#fef9c3;color:#854d0e',
  assigned:  'background:#dbeafe;color:#1e40af',
  completed: 'background:#dcfce7;color:#166534',
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * @param {{
 *   issues: object[],
 *   height?: string,
 *   center?: [number, number],
 *   zoom?: number,
 * }} props
 */
export default function IssueMap({
  issues = [],
  height = '500px',
  center = [20, 0],
  zoom   = 2,
}) {
  const validIssues = issues.filter(
    (i) => i.location?.lat != null && i.location?.lng != null
  )

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        {/* OpenStreetMap tiles — no API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit to issue locations */}
        {validIssues.length > 0 && <FitBounds issues={validIssues} />}

        {/* One CircleMarker per issue */}
        {validIssues.map((issue) => {
          const tier   = priorityTier(issue.priorityScore ?? 0)
          const colors = TIER_COLORS[tier]
          const radius = tier === 'high' ? 14 : tier === 'medium' ? 10 : 7

          return (
            <CircleMarker
              key={issue._id}
              center={[issue.location.lat, issue.location.lng]}
              radius={radius}
              pathOptions={{
                fillColor:   colors.fill,
                color:       colors.stroke,
                fillOpacity: 0.85,
                weight:      2,
              }}
            >
              <Popup maxWidth={280} minWidth={220}>
                {/* Popup content — plain HTML string for Leaflet compatibility */}
                <div style={{ fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.5' }}>
                  {/* Title */}
                  <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#1f2937' }}>
                    {issue.title}
                  </p>

                  {/* Description */}
                  {issue.description && (
                    <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                      {issue.description.length > 120
                        ? issue.description.slice(0, 120) + '…'
                        : issue.description}
                    </p>
                  )}

                  {/* Meta pills row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {/* Category */}
                    <span style={{
                      background: '#f0fdf4', color: '#166534',
                      padding: '2px 8px', borderRadius: '9999px',
                      fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {issue.category}
                    </span>

                    {/* Status */}
                    <span style={{
                      ...(STATUS_STYLES[issue.status]
                        ? Object.fromEntries(STATUS_STYLES[issue.status].split(';').map(s => s.split(':')))
                        : {}),
                      padding: '2px 8px', borderRadius: '9999px',
                      fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {issue.status}
                    </span>

                    {/* Priority tier */}
                    <span style={{
                      background: tier === 'high' ? '#fee2e2' : tier === 'medium' ? '#fef9c3' : '#dcfce7',
                      color:      tier === 'high' ? '#991b1b' : tier === 'medium' ? '#854d0e' : '#166534',
                      padding: '2px 8px', borderRadius: '9999px',
                      fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {tier} priority ({(issue.priorityScore ?? 0).toFixed(2)})
                    </span>
                  </div>

                  {/* Location */}
                  <p style={{ color: '#9ca3af', fontSize: '11px' }}>
                    📍 {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
