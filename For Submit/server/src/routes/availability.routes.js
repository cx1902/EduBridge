const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public/Student routes
router.get('/', authenticate, availabilityController.getSlots);
router.post('/:slotId/book', authenticate, authorize('STUDENT'), availabilityController.bookSlot);

// Tutor routes
router.post('/', authenticate, authorize('TUTOR'), availabilityController.addSlots);
router.delete('/:slotId', authenticate, authorize('TUTOR'), availabilityController.deleteSlot);

module.exports = router;
