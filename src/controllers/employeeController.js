const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const errorLogs = require('../utils/errorLogs');
const { transport } = require('../utils/emailTransporter');
const { handleValidationErrors } = require('../utils/validationUtil');

// Create a new employee
exports.createEmployee = async (req, res) => {
    // Input error handling
    const { isValid, errorMessages } = handleValidationErrors(req);

    if (!isValid) {
        return res.status(400).json({ error: errorMessages });
    }

    // Get request body
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

    // Get admin user_id
    const assigned_by = req.user.user_id;

    // Generate random password
    const length = 12;
    const password = crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convert to hexadecimal format
        .slice(0, length); // Return required number of characters
    
    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Configure the mailoptions object
    const text = `
        Dear ${email},

        Welcome to Ngabsen! Your account has been successfully created. Below are your login details:

        Email: ${email}
        Password: ${password}

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
        // Check is user exist
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { user_id: true },
        });

        // User not exist
        if (!existingUser) {
            // Create a new user
            user = await prisma.user.create({
                data: {
                    username,
                    password_hash,
                    roles: { set: ['employee'] },
                    email,
                    assigned_by,
                    full_name,
                    phone_number,
                    profile_picture_url: profilePictureUrl,
                },
            });

            // Create employee account
            employee = await prisma.employee.create({
                data: {
                  user_id: user.user_id,
                  position,
                  department,
                  manager_id: manager_id || null,
                  employment_date: new Date(employment_date),
                },
            });
        } else {// User exist
            // Check is user already has employee role
            if (!existingUser.roles.includes('employee')) {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        roles: { push: 'employee' }, // Tambah role employee
                    },
                });
            } else {
                // Already has employee role
                return res.status(400).json({ error: 'User already has employee role' });
            }
            
        }

        // Sen email & password to user email
        // transport.sendMail(mailOptions, function(error, info){
        //     if (error) {
        //         console.log({error: error.message})
        //     } else {
        //         console.log('Email sent: ' + info.response);
        //     }
        // });

        res.status(201).json({ user: user, employee: employee, password: password });
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

// Get an employee by user id
exports.getEmployeeByUserId = async (req, res) => {
    const { user_id } = req.params;

    try {
        const employee = await prisma.employee.findUnique({
            where: { user_id },
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
    // Input error handling
    const { isValid, errorMessages } = handleValidationErrors(req);

    if (!isValid) {
        return res.status(400).json({ error: errorMessages });
    }

    // Get employee id from paramteres
    const { user_id } = req.params;

    // Get data from request body
    const {
        username, email,
        full_name,
        phone_number,
        position,
        department,
        manager_id,
        assigned_by,
        employment_date,
    } = req.body;

    // Is user active
    const is_active = req.body.is_active === "true";

    // Get profile picture url path
    const profilePictureUrl = req.file ? req.file.path : null;

    try {
        // Pastikan employee dengan employee_id ada
        const existingEmployee = await prisma.employee.findUnique({
            where: { user_id },
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
                assignedBy: { connect: { user_id: assigned_by } },
                full_name,
                phone_number,
                profile_picture_url: profilePictureUrl || existingEmployee.profile_picture_url,
            },
        });
        
        // Get employee
        const employee = await prisma.employee.findUnique({
            where: { user_id },
            select: { employee_id: true },
        });

        // Update employee account
        const updatedEmployee = await prisma.employee.update({
            where: { employee_id: employee.employee_id },
            data: {
                user_id,
                position,
                department,
                manager_id: manager_id || null,
                employment_date,
            },
        });

        res.status(200).json({user: user, employee: updatedEmployee });
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