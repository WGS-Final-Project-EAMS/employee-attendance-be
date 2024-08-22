const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Create a new employee
router.post('/employees', employeeController.createEmployee);

// Get all employees
router.get('/employees', employeeController.getAllEmployees);

// Get an employee by ID
router.get('/employees/:employee_id', employeeController.getEmployeeById);

// Update an employee
router.put('/employees/:employee_id', employeeController.updateEmployee);

// // Delete an employee
// router.delete('/employees/:employee_id', employeeController.deleteEmployee);

module.exports = router;
