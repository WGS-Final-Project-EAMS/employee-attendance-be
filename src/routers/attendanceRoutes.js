const express = require('express');
const { clockIn, clockOut, getAttendanceHistory } = require('../controllers/attendanceController');
const { authenticateRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes untuk attendance
router.post('/clock-in', authenticateRole('employee'), clockIn);
router.post('/clock-out', authenticateRole('employee'), clockOut);
router.get('/attendance-history', authenticateRole('employee'), getAttendanceHistory);

module.exports = router;