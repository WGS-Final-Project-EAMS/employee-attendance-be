const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authMiddleware');

// router.post('/admin', userController.createAdmin);
// router.put('/api/admins/:admin_id', userController.updateAdmin);
// router.delete('/api/admins/:admin_id', userController.deleteAdmin);
router.get('/users', userController.getAllUsers);
router.get('/user/:user_id', userController.getUserById);
router.put('/user/change-password', authenticateUser(), userController.changePassword);
// router.get('/admin/:admin_id', userController.getAdminById);

module.exports = router;