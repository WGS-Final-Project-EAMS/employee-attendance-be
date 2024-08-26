const express = require('express');
const router = express.Router();
const { authenticateRole } = require('../middlewares/authMiddleware');
const {
    createErrorLog,
    getErrorLogs,
    getErrorLogById,
} = require('../controllers/errorLogController');

// Route to create an error log
router.post('/error-logs', createErrorLog);

// Route to get all error logs
router.get('/error-logs', authenticateRole('super_admin'), getErrorLogs);

// Route to get a specific error log by ID
router.get('/error-logs/:id', authenticateRole('super_admin'), getErrorLogById);

module.exports = router;