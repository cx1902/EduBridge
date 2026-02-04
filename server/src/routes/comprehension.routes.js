const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const comprehensionController = require('../controllers/comprehension.controller');

// Get questions for a lesson (students get questions without correct answers)
router.get('/lesson/:lessonId', authenticate, comprehensionController.getQuestions);

// Submit answers (students only)
router.post('/lesson/:lessonId/submit', authenticate, authorize('STUDENT'), comprehensionController.submitAnswers);

// Create question (tutors/admins only)
router.post('/lesson/:lessonId', authenticate, authorize('TUTOR', 'ADMIN'), comprehensionController.createQuestion);

// Update question (tutors/admins only)
router.put('/:id', authenticate, authorize('TUTOR', 'ADMIN'), comprehensionController.updateQuestion);

// Delete question (tutors/admins only)
router.delete('/:id', authenticate, authorize('TUTOR', 'ADMIN'), comprehensionController.deleteQuestion);

module.exports = router;
