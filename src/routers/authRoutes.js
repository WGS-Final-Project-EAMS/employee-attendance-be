const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation } = require('../validator/authValidation');

// Login
router.post('/login', loginValidation(), authController.login);

// Logout
router.post('/logout', authController.logout)

// Check token
router.get('/accessResource', authController.access_resource);

module.exports = router;