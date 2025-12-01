const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/:courseId', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get course lessons' });
});

router.post('/', authenticate, authorize('TUTOR', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Create lesson' });
});

module.exports = router;
