const { assignVolunteer } = require('../services/assignmentService');

// POST /api/assign
exports.postAssign = async (req, res) => {
  try {
    const result = await assignVolunteer();

    if (result.error === 'NO_PENDING_ISSUES') {
      return res.status(404).json({ message: 'No pending issues found' });
    }

    if (result.error === 'NO_VOLUNTEERS') {
      return res.status(404).json({ message: 'No available volunteers found' });
    }

    const { issue, volunteer } = result;

    res.status(200).json({
      issue,
      volunteer: {
        id:    volunteer._id,
        name:  volunteer.name,
        email: volunteer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
