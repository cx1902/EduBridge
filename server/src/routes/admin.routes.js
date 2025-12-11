const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:id/details', adminController.getUserDetails);
router.put('/users/:id/role', adminController.changeUserRole);
router.put('/users/:id/status', adminController.changeUserStatus);
router.post('/users/:id/reset-password', adminController.sendPasswordReset);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/role-history', adminController.getUserRoleHistory);

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/export', adminController.exportAuditLogs);
router.get('/audit-logs/stats', adminController.getAuditStats);

// ==================== TUTOR VERIFICATION ====================
router.get('/tutor-applications', adminController.getTutorApplications);
router.put('/tutor-applications/:id/review', adminController.reviewTutorApplication);

// ==================== CONTENT REPORTS ====================
router.get('/reports', adminController.getReports);
router.put('/reports/:id/resolve', adminController.resolveReport);

// ==================== SYSTEM SETTINGS ====================
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);
router.post('/settings/initialize', adminController.initializeSettings);

// ==================== EMAIL TEMPLATES ====================
router.get('/email-templates', adminController.getEmailTemplates);
router.put('/email-templates/:id', adminController.updateEmailTemplate);

// ==================== COURSE MODERATION ====================
router.get('/courses', adminController.getCourses);
router.put('/courses/:id/publish', adminController.publishCourse);
router.put('/courses/:id/unpublish', adminController.unpublishCourse);
router.post('/courses/:id/lock', adminController.lockCourse);

// ==================== QUESTION BANK ====================
router.get('/questions/performance', adminController.getQuestionPerformance);

// ==================== PAYMENT MANAGEMENT ====================
router.get('/transactions', adminController.getTransactions);
router.get('/payment-webhooks', adminController.getWebhookEvents);

// ==================== BROADCAST MESSAGING ====================
router.post('/broadcast', adminController.createBroadcast);
router.post('/broadcast/:id/send', adminController.sendBroadcast);
router.get('/broadcast', adminController.getBroadcasts);

// Legacy routes (keeping for backward compatibility)
router.get('/courses/pending', (req, res) => {
  res.json({ success: true, message: 'Get pending courses' });
});

router.post('/courses/:id/approve', (req, res) => {
  res.json({ success: true, message: 'Approve course' });
});

router.post('/courses/:id/reject', (req, res) => {
  res.json({ success: true, message: 'Reject course' });
});

router.get('/analytics', (req, res) => {
  res.json({ success: true, message: 'Get platform analytics' });
});

module.exports = router;
