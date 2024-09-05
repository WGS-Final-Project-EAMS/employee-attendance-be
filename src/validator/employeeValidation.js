const { body } = require('express-validator');

exports.employeeFormValidation = () => {
    return [
        body('email')
            .trim()
            .notEmpty().withMessage('email is required')
            .isEmail().withMessage('Invalid email address')
            .normalizeEmail(),
        body('phone_number')
            .trim()
            .isMobilePhone('id-ID').withMessage('Invalid phone number')
            .escape()
    ];
}