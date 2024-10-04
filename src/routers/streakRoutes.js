// routes/streakRoutes.js
const express = require('express');
const streakController = require('../controllers/streakController');
const { authenticateRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all streaks (admin access only)
router.get('/streaks', authenticateRole(['admin']), streakController.getAllStreaks);

// Get streak by employee ID (admin access only)
router.get('/streaks/employee/:employee_id', authenticateRole(['admin']), streakController.getStreakByEmployeeId);

// Get streak by logged-in user
router.get('/streaks/me', authenticateRole(['employee']), streakController.getStreakByUserId);

// Reset streak by employee ID (admin access only)
router.post('/streaks/reset/:employee_id', authenticateRole(['admin']), streakController.resetStreak);

// Optional: Get streak by date range (admin access only)
router.get('/streaks/range', authenticateRole(['admin']), streakController.getStreakByDateRange);

module.exports = router;