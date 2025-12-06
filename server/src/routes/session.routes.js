const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const sessionController = require('../controllers/session.controller');

// Public/General routes
router.get('/', authenticate, sessionController.getAvailableSessions);
router.get('/today', authenticate, authorize('TUTOR'), sessionController.getTodaySessions);

// Student booking routes
router.post('/:id/book', authenticate, sessionController.bookSession);
router.get('/my-bookings', authenticate, sessionController.getMyBookings);
router.post('/bookings/:id/cancel', authenticate, sessionController.cancelBooking);

// Tutor routes - Session management
router.post('/', authenticate, authorize('TUTOR'), sessionController.createSession);
router.post('/:sessionId/invite', authenticate, authorize('TUTOR'), sessionController.sendInvitations);
router.get('/:sessionId/email-status', authenticate, authorize('TUTOR', 'ADMIN'), sessionController.getEmailStatus);
router.post('/:sessionId/resend', authenticate, authorize('TUTOR'), sessionController.resendInvitation);
router.post('/:sessionId/remind', authenticate, authorize('TUTOR'), sessionController.sendReminder);

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

module.exports = router;
