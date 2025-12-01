const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get user notifications' });
});

router.put('/:id/read', authenticate, (req, res) => {
  res.json({ success: true, message: 'Mark notification as read' });
});

module.exports = router;
