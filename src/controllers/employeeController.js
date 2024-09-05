const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const errorLogs = require('../utils/errorLogs');
const { validationResult } = require('express-validator');
const { transport } = require('../utils/emailTransporter');

// Create a new employee
exports.createEmployee = async (req, res) => {
    const errors = validationResult(req);
    const errorMessages = errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
    }, {});

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errorMessages });
    }

    const {
        email,
        username,
        full_name,
        phone_number,
        position,
        department,
        manager_id,
        employment_date,
    } = req.body;

    const profilePictureUrl = req.file ? req.file.path : null;

    const length = 12;
  
    const password_hash = crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convert to hexadecimal format
        .slice(0, length); // Return required number of characters
    
    // Configure the mailoptions object
    const text = `
        Dear ${email},

        Welcome to Ngabsen! Your account has been successfully created. Below are your login details:

        Email: ${email}
        Password: ${password_hash}

        Please keep this information secure and do not share it with anyone. You can log in to the application at any time using the above credentials.

        If you have any questions or need assistance, feel free to contact our support team.

        Best regards,
        The Ngabsen Team
    `;

    const mailOptions = {
        from: 'no_reply@email.com',
        to: email,
        subject: 'New ngabsen employee account',
        text
    };

    try {

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
                profile_picture_url: profilePictureUrl,
                manager_id: manager_id || null,
                employment_date: new Date(employment_date),
            },
        });

        transport.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log({error: error.message})
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(201).json(newEmployee);
    } catch (error) {
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'CreateEmployeeError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get all active employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    is_active: true,
                }
            },
            include: {
                user: true,  // include user data for each employee
                manager: true, // include manager data if exists
            },
        });
        res.status(200).json(employees);
    } catch (error) {
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'getAllEmployeeError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get inactive employees
exports.getInactiveEmployees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    is_active: false,
                }
            },
            include: {
                user: true,
                manager: true,
            },
        });
        res.status(200).json(employees);
    } catch (error) {
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'GetInactiveEmployeeError',
            user_id,
        });

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
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'GetEmployeeByIdError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
    const { employee_id } = req.params;
    const {
        user_id,
        username, email,
        full_name,
        phone_number,
        position,
        department,
        manager_id,
        employment_date,
    } = req.body;

    const is_active = req.body.is_active === "true";

    const profilePictureUrl = req.file ? req.file.path : null;

    try {
        // Pastikan employee dengan employee_id ada
        const existingEmployee = await prisma.employee.findUnique({
            where: { employee_id },
        });

        if (!existingEmployee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Update user data
        const user = await prisma.user.update({
            where: { user_id },
            data: {
                username,
                email,
                is_active,
            },
        });
        
        const updatedEmployee = await prisma.employee.update({
            where: { employee_id },
            data: {
                user_id,
                full_name,
                phone_number,
                profile_picture_url: profilePictureUrl || existingEmployee.profile_picture_url,
                position,
                department,
                manager_id: manager_id || null,
                employment_date,
            },
        });

        res.status(200).json(updatedEmployee);
    } catch (error) {
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'UpdateEmployeeError',
            user_id,
        });

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
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'SetEmployeeStatusError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Delete an employee
// Delete only employee, user still exist in the database
exports.deleteEmployee = async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await prisma.employee.findUnique({
            where: { employee_id },
            select: { user_id: true }
        });
        
        const deletedEmployee = await prisma.employee.delete({
            where: { employee_id },
        });

        // Delete user data
        await prisma.user.delete({
            where: { user_id: employee.user_id },
        });

        res.status(204).json({ deletedEmployee });
    } catch (error) {
        const { user_id } = req.user;

        await errorLogs({
            error_message: error.message,
            error_type: 'DeleteEmployeeError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};