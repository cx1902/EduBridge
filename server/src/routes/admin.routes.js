const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/users', (req, res) => {
  res.json({ success: true, message: 'Get all users' });
});

router.get('/courses/pending', (req, res) => {
  res.json({ success: true, message: 'Get pending courses' });
});

router.post('/courses/:id/approve', (req, res) => {
  res.json({ success: true, message: 'Approve course' });
});

router.post('/courses/:id/reject', (req, res) => {
  res.json({ success: true, message: 'Reject course' });
});

router.get('/analytics', (req, res) => {
  res.json({ success: true, message: 'Get platform analytics' });
});

module.exports = router;
