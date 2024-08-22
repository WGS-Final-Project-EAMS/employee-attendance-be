const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { createAdminValidation } = require('../validator/adminValidation');

router.post('/admin', createAdminValidation(), adminController.createAdmin);
// router.put('/api/admins/:admin_id', adminController.updateAdmin);
// router.delete('/api/admins/:admin_id', adminController.deleteAdmin);
router.get('/admins', adminController.getAllAdmins);
router.get('/admin/:admin_id', adminController.getAdminById);

module.exports = router;