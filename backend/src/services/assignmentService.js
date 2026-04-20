const Issue = require('../models/Issue');
const User = require('../models/User');
const { haversine } = require('../utils/haversine');

/**
 * Assign the highest-priority pending issue to the closest available volunteer.
 *
 * Algorithm:
 *  1. Find the highest-priority pending issue.
 *  2. Find all available volunteers (role='volunteer', availability=true).
 *  3. Skill filter: keep volunteers whose skills include the issue category.
 *     Fall back to all available volunteers if none match.
 *  4. Sort candidates by Haversine distance to the issue (no location → last).
 *  5. Assign: update issue status + assignedTo, set volunteer availability=false.
 *
 * @returns {Promise<
 *   { issue: object, volunteer: object } |
 *   { error: 'NO_PENDING_ISSUES' | 'NO_VOLUNTEERS' }
 * >}
 */
async function assignVolunteer() {
  // Step 1 — highest-priority pending issue
  const issue = await Issue.findOne({ status: 'pending' }).sort({ priorityScore: -1 });
  if (!issue) {
    return { error: 'NO_PENDING_ISSUES' };
  }

  // Step 2 — available volunteers
  let candidates = await User.find({ role: 'volunteer', availability: true });
  if (!candidates.length) {
    return { error: 'NO_VOLUNTEERS' };
  }

  // Step 3 — skill filter (fall back to all if no skill match)
  const skilled = candidates.filter((v) =>
    Array.isArray(v.skills) && v.skills.includes(issue.category)
  );
  if (skilled.length > 0) {
    candidates = skilled;
  }

  // Step 4 — sort by Haversine distance; volunteers without location ranked last
  candidates.sort((a, b) => {
    const distA =
      a.location?.lat != null && a.location?.lng != null
        ? haversine(a.location.lat, a.location.lng, issue.location.lat, issue.location.lng)
        : Infinity;
    const distB =
      b.location?.lat != null && b.location?.lng != null
        ? haversine(b.location.lat, b.location.lng, issue.location.lat, issue.location.lng)
        : Infinity;
    return distA - distB;
  });

  // Step 5 — assign the closest candidate
  const volunteer = candidates[0];

  await Promise.all([
    Issue.findByIdAndUpdate(issue._id, {
      status: 'assigned',
      assignedTo: volunteer._id,
    }),
    User.findByIdAndUpdate(volunteer._id, { availability: false }),
  ]);

  const updatedIssue = await Issue.findById(issue._id);

  return { issue: updatedIssue, volunteer };
}

module.exports = { assignVolunteer };
