const express = require('express');
const router = express.Router();
const officeSettingsController = require('../controllers/officeSettingsController');
const { authenticateRole } = require('../middleware/authMiddleware');

// Create a new office settings
router.post('/office-settings', authenticateRole(['admin']), officeSettingsController.createOfficeSettings);

// Get office settings
router.get('/office-settings', authenticateRole(['admin', 'employee']), officeSettingsController.getOfficeSettings);

// Update office settings
router.put('/office-settings', authenticateRole(['admin']), officeSettingsController.updateOfficeSettings);

// Delete office settings
router.delete('/office-settings', authenticateRole(['admin']), officeSettingsController.deleteOfficeSettings);

module.exports = router;