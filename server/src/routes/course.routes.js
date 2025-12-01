const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');

// Public course routes
router.get('/', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Get all courses' });
});

router.get('/:id', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Get course by ID' });
});

// Protected tutor routes
router.post('/', authenticate, authorize('TUTOR', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Create course' });
});

router.put('/:id', authenticate, authorize('TUTOR', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Update course' });
});

router.delete('/:id', authenticate, authorize('TUTOR', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Delete course' });
});

// Enrollment routes
router.post('/:id/enroll', authenticate, (req, res) => {
  res.json({ success: true, message: 'Enroll in course' });
});

module.exports = router;
