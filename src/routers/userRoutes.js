const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Get all user
router.get('/users', userController.getAllUsers);

// Get user by id
router.get('/user', authenticateUser(), userController.getUserById);

// Change user password
router.put('/user/change-password', authenticateUser(), userController.changePassword);

// Reset user password
router.put('/user/reset-password', userController.resetPassword);

module.exports = router;