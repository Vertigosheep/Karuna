const express = require('express');
const {
  createIssue,
  getIssues,
  getMyTasks,
  getIssueById,
  updateIssueStatus,
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.post('/',   createIssue);
router.get('/',    getIssues);

// Protected — must come before /:id to avoid route shadowing
router.get('/my-tasks', protect, getMyTasks);

// Public by id
router.get('/:id', getIssueById);

// Protected — status update
router.patch('/:id/status', protect, updateIssueStatus);

module.exports = router;
