const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateRole } = require('../middleware/authMiddleware');
const { employeeFormValidation } = require('../validator/employeeValidation');
const { upload } = require('../middleware/multerMiddleware');

// Create a new employee
router.post('/employees', authenticateRole(['admin']), upload.single('profile_picture_url'), employeeFormValidation(), employeeController.createEmployee);

// Get all employees
router.get('/employees', authenticateRole(['super_admin', 'admin']), employeeController.getAllEmployees);

// Get inactive employees
router.get('/employees/inactive', authenticateRole(['admin']), employeeController.getInactiveEmployees);

// Get an employee by ID
router.get('/employees/:employee_id', authenticateRole(['admin']), employeeController.getEmployeeById);

// Get an employee by user id
router.get('/employees-user/:user_id', authenticateRole(['super_admin', 'admin']), employeeController.getEmployeeByUserId);

// Update an employee
router.put('/employees/:user_id', authenticateRole(['admin']), upload.single('profile_picture_url'), employeeFormValidation(), employeeController.updateEmployee);

// Activate or deactivate an employee
router.patch('/employees/:employee_id/status', authenticateRole(['admin']), employeeController.setEmployeeStatus);

// Delete an employee
router.delete('/employees/:employee_id', authenticateRole(['admin']), employeeController.deleteEmployee);

module.exports = router;
