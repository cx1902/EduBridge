const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inbox.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Routes
router.get('/', inboxController.getInbox);
router.get('/sent', inboxController.getSent);
router.post('/send', inboxController.sendMessage);
router.get('/:id', inboxController.getMessage);
router.put('/:id/read', inboxController.markAsRead);

module.exports = router;
