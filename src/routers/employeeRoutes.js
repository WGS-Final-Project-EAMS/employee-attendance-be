const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Auth middleware
router.use(authenticateAdmin);

// Create a new employee
router.post('/employees', employeeController.createEmployee);

// Get all employees
router.get('/employees', employeeController.getAllEmployees);

// Get inactive employees
router.get('/employees/inactive', employeeController.getInactiveEmployees);

// Get an employee by ID
router.get('/employees/:employee_id', employeeController.getEmployeeById);

// Update an employee
router.put('/employees/:employee_id', employeeController.updateEmployee);

// Activate or deactivate an employee
router.patch('/employees/:employee_id/status', employeeController.setEmployeeStatus);

// Delete an employee
router.delete('/employees/:employee_id', employeeController.deleteEmployee);

module.exports = router;
