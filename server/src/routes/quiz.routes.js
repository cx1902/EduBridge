const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/:lessonId', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get lesson quiz' });
});

router.post('/:quizId/attempt', authenticate, (req, res) => {
  res.json({ success: true, message: 'Submit quiz attempt' });
});

module.exports = router;
