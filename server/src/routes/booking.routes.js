const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');

// Search tutors (accessible to all authenticated users)
router.get('/tutors/search', authenticate, bookingController.searchTutors);

// Student routes - Create and manage booking requests
router.post('/request', authenticate, authorize('STUDENT'), bookingController.createBookingRequest);
router.get('/my-requests', authenticate, authorize('STUDENT'), bookingController.getMyBookingRequests);
router.delete('/:id/cancel', authenticate, authorize('STUDENT'), bookingController.cancelBooking);

// Tutor routes - View and respond to booking requests
router.get('/received', authenticate, authorize('TUTOR', 'ADMIN'), bookingController.getReceivedBookingRequests);
router.post('/:id/accept', authenticate, authorize('TUTOR', 'ADMIN'), bookingController.acceptBooking);
router.post('/:id/decline', authenticate, authorize('TUTOR', 'ADMIN'), bookingController.declineBooking);

module.exports = router;
