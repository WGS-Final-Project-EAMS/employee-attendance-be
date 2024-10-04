const express = require('express');
const { clockIn, clockOut, getAttendanceHistory, getAttendanceRecap, checkAttendanceStatus, getTodayAttendance, cancelClockOut } = require('../controllers/attendanceController');
const { authenticateRole } = require('../middleware/authMiddleware');

const router = express.Router();

// =================================
// Routes for attendance tracking
// For: employee
// =================================
router.post('/clock-in', authenticateRole(['employee']), clockIn);
router.post('/clock-out', authenticateRole(['employee']), clockOut);
router.patch('/cancel-clock-out', authenticateRole(['employee']), cancelClockOut);
router.get('/attendance-status', authenticateRole(['employee']), checkAttendanceStatus);
router.get('/today-attendance', authenticateRole(['employee']), getTodayAttendance)
router.get('/attendance-history', authenticateRole(['employee']), getAttendanceHistory);

// ============================
// Routes for attendance recap
// For: admin
// ============================
router.get('/attendance-recap', authenticateRole(['admin']), getAttendanceRecap);

module.exports = router;