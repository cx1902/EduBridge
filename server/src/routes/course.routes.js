const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');
const courseController = require('../controllers/course.controller');

// Public course routes
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.get('/:id/enrollments', authenticate, authorize('TUTOR', 'ADMIN'), courseController.getCourseEnrollments);

// Protected tutor routes
router.post('/', authenticate, authorize('TUTOR', 'ADMIN'), courseController.createCourse);
router.put('/:id', authenticate, authorize('TUTOR', 'ADMIN'), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('TUTOR', 'ADMIN'), courseController.deleteCourse);

// Enrollment routes
router.post('/:id/enroll', authenticate, courseController.enrollInCourse);

module.exports = router;
