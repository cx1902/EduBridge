const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.post('/process', authenticate, (req, res) => {
  res.json({ success: true, message: 'Process payment' });
});

router.get('/transactions', authenticate, (req, res) => {
  res.json({ success: true, message: 'Get user transactions' });
});

module.exports = router;
