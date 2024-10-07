const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateRole } = require('../middleware/authMiddleware');

// Get all user notification
router.get('/notification', authenticateRole(['employee']), notificationController.getNotification);

// Update is_read user notification
router.put('/notification', authenticateRole(['employee']), notificationController.updateNotification);

module.exports = router;