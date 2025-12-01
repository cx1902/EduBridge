const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get available sessions' });
});

router.post('/', authenticate, authorize('TUTOR'), (req, res) => {
  res.json({ success: true, message: 'Create tutoring session' });
});

router.post('/:id/book', authenticate, (req, res) => {
  res.json({ success: true, message: 'Book session' });
});

module.exports = router;
