const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation } = require('../validator/authValidation');

router.post('/login', loginValidation(), authController.login);
router.get('/accessResource', authController.access_resource);

module.exports = router;