const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { createAdminValidation } = require('../validator/adminValidation');
// const { authenticateToken } = require('../middleware/adminAuthMiddleware');

router.post('/admin', createAdminValidation(), adminController.createAdmin);
router.put('/admin/:admin_id', adminController.updateAdmin);
// router.delete('/api/admins/:admin_id', adminController.deleteAdmin);
router.get('/admins', adminController.getAllAdmins);
router.get('/admin/:admin_id', adminController.getAdminById);

module.exports = router;