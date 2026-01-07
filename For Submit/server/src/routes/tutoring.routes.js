const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createRequest,
  getMatches,
  bookTutor,
  getSubjects
} = require('../controllers/tutoring.controller');

// Public routes
router.get('/subjects', getSubjects);

// Protected routes (Student only)
router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/requests', createRequest);
router.get('/requests/:id/matches', getMatches);
router.post('/requests/:id/book', bookTutor);

module.exports = router;