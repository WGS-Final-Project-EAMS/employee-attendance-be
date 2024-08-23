const { body } = require('express-validator');

exports.loginValidation = () => {
    return [
        body('email')
            .trim()
            .notEmpty().withMessage('email is required')
            .isEmail().withMessage('Invalid email address')
            .normalizeEmail(),
        body('password')
            .trim()
            .notEmpty().withMessage('password is required')
            .escape()
    ];
}