const Issue = require('../models/Issue');

// Tunable constants
const FREQ_CAP    = 10;   // issue count at which frequency saturates to 1.0
const DENSITY_CAP = 10;   // nearby issue count at which density saturates to 1.0
const RADIUS_DEG  = 0.1;  // proximity radius in decimal degrees (~11 km)

/**
 * Clamp a value to the [0, 1] range.
 * @param {number} v
 * @returns {number}
 */
function clamp(v) {
  return Math.min(Math.max(v, 0), 1);
}

/**
 * Compute a priority score for an issue using the formula:
 *   priorityScore = (0.4 × severity) + (0.3 × frequency) + (0.3 × locationDensity)
 *
 * All components are normalised to [0, 1] before the formula is applied.
 *
 * @param {object} params
 * @param {number} [params.severity=0]   - ML-derived severity score (0–1)
 * @param {string} params.category       - Issue category (used for frequency count)
 * @param {{ lat: number, lng: number }} params.location - Issue coordinates
 * @returns {Promise<number>} Priority score rounded to 4 decimal places
 */
async function computePriority({ severity = 0, category, location }) {
  const [sameCategoryCount, nearbyCount] = await Promise.all([
    // Frequency: how many existing issues share the same category
    Issue.countDocuments({ category }),

    // Location density: how many existing issues are within RADIUS_DEG of this one
    Issue.countDocuments({
      'location.lat': {
        $gte: location.lat - RADIUS_DEG,
        $lte: location.lat + RADIUS_DEG,
      },
      'location.lng': {
        $gte: location.lng - RADIUS_DEG,
        $lte: location.lng + RADIUS_DEG,
      },
    }),
  ]);

  const s  = clamp(severity);
  const f  = clamp(sameCategoryCount / FREQ_CAP);
  const ld = clamp(nearbyCount       / DENSITY_CAP);

  const score = (0.4 * s) + (0.3 * f) + (0.3 * ld);

  // Round to 4 decimal places
  return Math.round(score * 10000) / 10000;
}

module.exports = { computePriority };
