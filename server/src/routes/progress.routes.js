const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/my-progress', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get user progress' });
});

router.post('/lesson/:lessonId', authenticate, (req, res) => {
  res.json({ success: true, message: 'Update lesson progress' });
});

module.exports = router;
