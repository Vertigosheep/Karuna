/**
 * Colour-coded priority badge.
 *
 * Thresholds:
 *   High   ≥ 0.66  → red
 *   Medium ≥ 0.33  → yellow
 *   Low    < 0.33  → green
 */
export function priorityTier(score) {
  if (score >= 0.66) return 'high'
  if (score >= 0.33) return 'medium'
  return 'low'
}

const TIER_STYLES = {
  high:   'bg-red-100    text-red-700    border border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low:    'bg-green-100  text-green-700  border border-green-200',
}

const TIER_LABELS = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
}

/**
 * @param {{ score: number, showValue?: boolean }} props
 */
export default function PriorityBadge({ score, showValue = true }) {
  const tier = priorityTier(score)
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${TIER_STYLES[tier]}`}>
      {/* Coloured dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${
        tier === 'high' ? 'bg-red-500' : tier === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      {TIER_LABELS[tier]}
      {showValue && (
        <span className="opacity-70">({score.toFixed(2)})</span>
      )}
    </span>
  )
}
