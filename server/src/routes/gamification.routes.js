const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/badges', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get user badges' });
});

router.get('/leaderboard', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get leaderboard' });
});

module.exports = router;
