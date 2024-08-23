const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Create a new employee
exports.createEmployee = async (req, res) => {
    try {
        const {
            email,
            username,
            full_name,
            phone_number,
            position,
            department,
            profile_picture_url,
            manager_id,
            employment_date,
            status,
        } = req.body;

        const length = 12;
      
        const password_hash = crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex') // Convert to hexadecimal format
            .slice(0, length); // Return required number of characters

        // Create a new user
        const user = await prisma.user.create({
            data: {
                username,
                password_hash,
                role: "employee",
                email,
            },
        });

        const newEmployee = await prisma.employee.create({
            data: {
                user_id: user.user_id,
                full_name,
                phone_number,
                position,
                department,
                profile_picture_url,
                manager_id: manager_id || null,
                employment_date: new Date(employment_date),
                status,
            },
        });

        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all active employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: {status: 'active'},
            include: {
                user: true,  // include user data for each employee
                manager: true, // include manager data if exists
            },
        });
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get inactive employees
exports.getInactiveEmployees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: {status: 'inactive'},
            include: {
                user: true,  // include user data for each employee
            },
        });
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get an employee by ID
exports.getEmployeeById = async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await prisma.employee.findUnique({
            where: { employee_id },
            include: {
                user: true,
                manager: true,
            },
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
    const { employee_id } = req.params;
    const {
        user_id,
        full_name,
        phone_number,
        profile_picture_url,
        position,
        department,
        manager_id,
        employment_date,
        status,
    } = req.body;

    try {
        const updatedEmployee = await prisma.employee.update({
            where: { employee_id },
            data: {
                user_id,
                full_name,
                phone_number,
                profile_picture_url,
                position,
                department,
                manager_id,
                employment_date,
                status,
            },
        });

        res.status(200).json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Activate and Deactivate an employee
exports.setEmployeeStatus = async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await prisma.employee.findUnique({
            where: { employee_id },
            select: { status: true },
        });

        const status = employee.status === 'active' ? 'inactive' : 'active';

        const updatedEmployee = await prisma.employee.update({
            where: { employee_id },
            data: { status },
        });

        res.status(200).json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an employee
// Delete only employee, user still exist in the database
exports.deleteEmployee = async (req, res) => {
    const { employee_id } = req.params;

    try {
        const deletedEmployee = await prisma.employee.delete({
            where: { employee_id },
        });

        res.status(204).json({ deletedEmployee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};