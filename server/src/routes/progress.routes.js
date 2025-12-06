const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const progressController = require('../controllers/progress.controller');

// Get student progress summary
router.get('/my-progress', authenticate, progressController.getMyProgress);

// Update video position
router.put('/lesson/:id', authenticate, progressController.updateVideoPosition);

// Mark lesson complete
router.post('/lesson/:id/complete', authenticate, progressController.markLessonComplete);

// Save lesson notes
router.put('/lesson/:id/notes', authenticate, progressController.saveLessonNotes);

// Toggle bookmark
router.post('/lesson/:id/bookmark', authenticate, progressController.toggleBookmark);

module.exports = router;
