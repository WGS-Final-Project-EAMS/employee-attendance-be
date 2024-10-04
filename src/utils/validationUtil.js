const { validationResult } = require('express-validator');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});
    
    return { isValid: false, errorMessages };
  }
  
  return { isValid: true, errorMessages: {} };
};

module.exports = { handleValidationErrors };