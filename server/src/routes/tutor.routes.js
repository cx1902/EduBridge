const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getDashboardStats,
  getTodaysSessions,
  getRecentEnrollments,
  getTutorNotifications,
  createCourse,
  getTutorCourses,
  getTutorCourseDetails,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  createLesson,
  getLessons,
  getLessonDetails,
  updateLesson,
  deleteLesson,
  reorderLessons,
  createQuiz,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} = require('../controllers/tutor.controller');

// All routes require authentication and tutor role
router.use(authenticate);
router.use(authorize('TUTOR', 'ADMIN'));

// Dashboard endpoints
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/sessions/today', getTodaysSessions);
router.get('/dashboard/enrollments/recent', getRecentEnrollments);
router.get('/dashboard/notifications', getTutorNotifications);

// Course management endpoints
router.post('/courses', createCourse);
router.get('/courses', getTutorCourses);
router.get('/courses/:id', getTutorCourseDetails);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.patch('/courses/:id/publish', togglePublishCourse);

// Lesson management endpoints
router.post('/courses/:courseId/lessons', createLesson);
router.get('/courses/:courseId/lessons', getLessons);
router.get('/lessons/:id', getLessonDetails);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);
router.patch('/lessons/reorder', reorderLessons);

// Quiz management endpoints
router.post('/courses/:courseId/quizzes', createQuiz);
router.get('/quizzes/:id', getQuizDetails);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);

// Question management endpoints
router.post('/quizzes/:quizId/questions', addQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.patch('/questions/reorder', reorderQuestions);

module.exports = router;
