const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const gamificationController = require('../controllers/gamification.controller');

// Get user's earned badges
router.get('/badges', authenticate, gamificationController.getUserBadges);

// Get all badges with unlock status
router.get('/badges/available', authenticate, gamificationController.getAllBadges);

// Get points transaction history
router.get('/points', authenticate, gamificationController.getPointsHistory);

// Get leaderboard
router.get('/leaderboard', authenticate, gamificationController.getLeaderboard);

// Get streak information
router.get('/streaks', authenticate, gamificationController.getStreakInfo);

// Use streak freeze
router.post('/streaks/freeze', authenticate, gamificationController.useStreakFreeze);

module.exports = router;
