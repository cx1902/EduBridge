const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const quizController = require('../controllers/quiz.controller');

// Create new quiz (Tutor/Admin)
router.post('/lesson/:lessonId', authenticate, authorize('TUTOR', 'ADMIN'), quizController.createQuiz);

// Update quiz (Tutor/Admin)
router.put('/:id', authenticate, authorize('TUTOR', 'ADMIN'), quizController.updateQuiz);

// Delete quiz (Tutor/Admin)
router.delete('/:id', authenticate, authorize('TUTOR', 'ADMIN'), quizController.deleteQuiz);

// Get quiz by lesson ID
router.get('/:lessonId', authenticate, quizController.getQuizByLesson);

// Submit quiz attempt
router.post('/:quizId/attempt', authenticate, quizController.submitQuizAttempt);

// Get attempt history for a quiz
router.get('/:quizId/attempts', authenticate, quizController.getAttemptHistory);

// Get all user's quiz attempts
router.get('/my-attempts', authenticate, quizController.getMyQuizAttempts);

module.exports = router;
