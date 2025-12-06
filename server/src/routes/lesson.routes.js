const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const lessonController = require('../controllers/lesson.controller');

// Get single lesson with progress
router.get('/:id', authenticate, lessonController.getLessonById);

// Get all lessons for a course
router.get('/course/:courseId', authenticate, lessonController.getCourseLessons);

// Tutor routes
router.post('/', authenticate, authorize('TUTOR', 'ADMIN'), lessonController.createLesson);
router.put('/:id', authenticate, authorize('TUTOR', 'ADMIN'), lessonController.updateLesson);
router.delete('/:id', authenticate, authorize('TUTOR', 'ADMIN'), lessonController.deleteLesson);

module.exports = router;
