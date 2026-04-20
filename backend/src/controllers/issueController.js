const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { analyzeText } = require('../services/mlService');
const { computePriority } = require('../services/priorityService');

// POST /api/issues
exports.createIssue = async (req, res) => {
  try {
    const { title, description, location, category } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ message: 'title, description, and category are required' });
    }

    if (
      !location ||
      typeof location.lat !== 'number' ||
      !isFinite(location.lat) ||
      typeof location.lng !== 'number' ||
      !isFinite(location.lng)
    ) {
      return res
        .status(400)
        .json({ message: 'location.lat and location.lng must be finite numbers' });
    }

    const initialPriority = await computePriority({
      severity: 0,
      category,
      location,
    });

    const issue = await Issue.create({
      title,
      description,
      location,
      category,
      priorityScore: initialPriority,
    });

    res.status(201).json(issue);

    analyzeText(description).then(async (result) => {
      if (!result) return;
      try {
        const updatedPriority = await computePriority({
          severity: result.severity_score ?? 0,
          category,
          location,
        });
        await Issue.findByIdAndUpdate(issue._id, {
          priorityScore: updatedPriority,
          mlAnalysis: {
            keywords:      result.keywords       ?? [],
            category:      result.category       ?? '',
            severityScore: result.severity_score ?? 0,
            analyzed:      true,
          },
        });
      } catch (updateErr) {
        console.error('[createIssue] ML/priority patch failed:', updateErr.message);
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/issues
exports.getIssues = async (_req, res) => {
  try {
    const issues = await Issue.find().sort({ priorityScore: -1, createdAt: -1 });
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/issues/my-tasks  (volunteer: issues assigned to the logged-in user)
exports.getMyTasks = async (req, res) => {
  try {
    const issues = await Issue.find({ assignedTo: req.user._id })
      .sort({ priorityScore: -1, createdAt: -1 });
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/issues/:id
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/issues/:id/status
// Allowed transitions:
//   volunteer: assigned → completed  (mark complete)
//   volunteer: assigned → pending    (reject / unassign self)
//   admin:     any → any
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    const VALID_STATUSES = ['pending', 'assigned', 'completed'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const isAdmin     = req.user.role === 'admin';
    const isAssignee  = issue.assignedTo &&
                        issue.assignedTo.toString() === req.user._id.toString();

    // Volunteers may only update issues assigned to them
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not authorised to update this issue' });
    }

    // Volunteers: only pending (reject) or completed (finish) are valid targets
    if (!isAdmin && !['pending', 'completed'].includes(status)) {
      return res.status(403).json({ message: 'Volunteers can only mark issues as completed or pending' });
    }

    const updates = { status };

    // If volunteer rejects (pending), free up their availability and clear assignedTo
    if (status === 'pending' && isAssignee) {
      updates.assignedTo = null;
      await User.findByIdAndUpdate(req.user._id, { availability: true });
    }

    const updated = await Issue.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
