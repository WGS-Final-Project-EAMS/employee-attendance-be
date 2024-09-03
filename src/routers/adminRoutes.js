const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { createAdminValidation } = require('../validator/adminValidation');
const { authenticateRole } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/multerMiddleware');

// Create New Admin
router.post('/admin', authenticateRole('super_admin'), upload.single('profile_picture_url'), createAdminValidation(), adminController.createAdmin);

// Update an admin by id
router.put('/admin/:admin_id', authenticateRole('super_admin'), upload.single('profile_picture_url'), adminController.updateAdmin);
// router.delete('/api/admins/:admin_id', adminController.deleteAdmin);

// Get all admin
router.get('/admins', authenticateRole('super_admin'), adminController.getAllAdmins);

// Get active admin
router.get('/admins/active', authenticateRole('super_admin'), adminController.getActiveAdmins);

// Get non-active admin
router.get('/admins/non-active', authenticateRole('super_admin'), adminController.getNonactiveAdmins);

// Get admin by id
router.get('/admin/:admin_id', authenticateRole('super_admin'), adminController.getAdminById);

// Hard delete admin
router.delete('/admin/:admin_id', authenticateRole('super_admin'), adminController.deleteAdmin);

module.exports = router;