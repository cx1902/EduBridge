const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const sessionController = require('../controllers/session.controller');

// Public/General routes
router.get('/', authenticate, sessionController.getAvailableSessions);
router.get('/today', authenticate, authorize('TUTOR'), sessionController.getTodaySessions);
router.get('/tutor', authenticate, authorize('TUTOR'), sessionController.getTutorSessions);
// GET /:id moved to bottom to prevent shadowing

// Student booking routes
router.post('/:id/book', authenticate, sessionController.bookSession);
router.get('/my-bookings', authenticate, sessionController.getMyBookings);
router.post('/bookings/:id/cancel', authenticate, sessionController.cancelBooking);

// Get tutor's available 1-hour slots
router.get('/tutors/:tutorId/available-slots', authenticate, sessionController.getTutorAvailableSlots);

// Tutor routes - Session management
router.post('/', authenticate, authorize('TUTOR'), sessionController.createSession);
router.post('/:sessionId/invite', authenticate, authorize('TUTOR'), sessionController.sendInvitations);
router.get('/:sessionId/email-status', authenticate, authorize('TUTOR', 'ADMIN'), sessionController.getEmailStatus);
router.post('/:sessionId/resend', authenticate, authorize('TUTOR'), sessionController.resendInvitation);
router.post('/:sessionId/remind', authenticate, authorize('TUTOR'), sessionController.sendReminder);
router.patch('/:id/status', authenticate, authorize('TUTOR'), sessionController.updateSessionStatus);
router.post('/:id/confirm-booking', authenticate, authorize('TUTOR'), sessionController.confirmBookingRequest);
router.post('/:id/decline-booking', authenticate, authorize('TUTOR'), sessionController.declineBookingRequest);
router.patch('/:id', authenticate, authorize('TUTOR'), sessionController.updateSession);
router.delete('/:id', authenticate, authorize('TUTOR'), sessionController.deleteSession);


// Student routes - Session responses
router.post('/:sessionId/confirm', authenticate, authorize('STUDENT'), sessionController.confirmAttendance);
router.post('/:sessionId/decline', authenticate, authorize('STUDENT'), sessionController.declineInvitation);
router.post('/:sessionId/reschedule', authenticate, authorize('STUDENT'), sessionController.requestReschedule);
router.get('/invitations', authenticate, authorize('STUDENT'), sessionController.getPendingInvitations);

// Email webhook endpoints (for email service provider callbacks)
router.post('/webhooks/email/delivered', (req, res) => {
  // TODO: Implement webhook handler for email delivery confirmation
  res.json({ success: true });
});

router.post('/webhooks/email/opened', (req, res) => {
  // TODO: Implement webhook handler for email open tracking
  res.json({ success: true });
});

router.post('/webhooks/email/clicked', (req, res) => {
  // TODO: Implement webhook handler for link click tracking
  res.json({ success: true });
});

router.post('/webhooks/email/bounced', (req, res) => {
  // TODO: Implement webhook handler for bounce notification
  res.json({ success: true });
});

router.post('/webhooks/email/complaint', (req, res) => {
  // TODO: Implement webhook handler for spam complaints
  res.json({ success: true });
});

// Get specific session details (Must be last to avoid shadowing specific routes)
router.get('/:id', authenticate, sessionController.getSession);

// Rate session
router.post('/:id/rate', authenticate, authorize('STUDENT'), sessionController.rateSession);

module.exports = router;
