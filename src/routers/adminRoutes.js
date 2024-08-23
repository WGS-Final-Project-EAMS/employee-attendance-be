const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { createAdminValidation } = require('../validator/adminValidation');
const { authenticateRole } = require('../middleware/authMiddleware');

// Auth middleware

router.post('/admin', authenticateRole('super_admin'), createAdminValidation(), adminController.createAdmin);
router.put('/admin/:admin_id', authenticateRole('super_admin'), adminController.updateAdmin);
// router.delete('/api/admins/:admin_id', adminController.deleteAdmin);
router.get('/admins', authenticateRole('super_admin'), adminController.getAllAdmins);
router.get('/admin/:admin_id', authenticateRole('super_admin'), adminController.getAdminById);

module.exports = router;