const express = require('express');
const { postAssign } = require('../controllers/assignController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, postAssign);

module.exports = router;
