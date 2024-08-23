const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// router.post('/admin', userController.createAdmin);
// router.put('/api/admins/:admin_id', userController.updateAdmin);
// router.delete('/api/admins/:admin_id', userController.deleteAdmin);
router.get('/users', userController.getAllUsers);
// router.get('/admin/:admin_id', userController.getAdminById);

module.exports = router;