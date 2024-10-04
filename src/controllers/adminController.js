const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const { profile } = require('console');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const errorLogs = require('../utils/errorLogs');
const { transport } = require('../utils/emailTransporter');
const { handleValidationErrors } = require('../utils/validationUtil');

// Create Admin
exports.createAdmin = async (req, res) => {
  // Input error handling
  const { isValid, errorMessages } = handleValidationErrors(req);

  if (!isValid) {
      return res.status(400).json({ error: errorMessages });
  }

  const { username, email, full_name, phone_number, position, department, manager_id, employment_date } = req.body;
  const profilePictureUrl = req.file ? req.file.path : null;
  const assigned_by = req.user.user_id;
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
    subject: 'New ngabsen account',
    text
  };

  try {
    // Check is user exist
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    let user;
    let employee;
    
    // User not exist
    if (!existingUser) {
      // Create a new user
      user = await prisma.user.create({
        data: {
          username,
          password_hash,
          roles: { set: ['admin', 'employee'] },
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
      // Check is user already has admin role
      if (!existingUser.roles.includes('admin')) {
        user = await prisma.user.update({
          where: { email },
          data: {
              roles: { push: 'admin' }, // Tambah role admin
          },
        });
      } else {
        // Already has admin role
        return res.status(400).json({ error: 'User already has admin role' });
      }
      
    }
  
    // Send email & password to user email
    transport.sendMail(mailOptions, function(error, info){
      if (error) {
          console.log({error: error.message})
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(201).json({user: user, employee: employee, password: password});
  } catch (error) {
    const { user_id } = req.user;

    await errorLogs({
      error_message: error.message,
      error_type: 'CreateAdminError',
      user_id,
    });
  
    res.status(500).json({ error: error.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  // Input error handling
  const { isValid, errorMessages } = handleValidationErrors(req);

  if (!isValid) {
      return res.status(400).json({ error: errorMessages });
  }
  
  const { user_id } = req.params;
  const { username, email, assigned_by, full_name, phone_number, position, department, manager_id, employment_date } = req.body;
  const is_active = req.body.is_active === "true";
  
  const profilePictureUrl = req.file ? req.file.path : null;
  
  try {
    // Pastikan admin dengan admin_id ada
    const existingAdmin = await prisma.user.findUnique({
      where: { user_id },
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Update user data
    const user = await prisma.user.update({
      where: { user_id },
      data: {
        username,
        email,
        is_active,
        // assignedBy: { connect: { user_id: assigned_by } },
        full_name,
        phone_number,
        profile_picture_url: profilePictureUrl || existingAdmin.profile_picture_url,
      },
    });

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { user_id },
      select: { employee_id: true },
    });

    // Update employee account
    const employeeUpdated = await prisma.employee.update({
      where: {employee_id: employee.employee_id},
      data: {
        user_id: user_id,
        position,
        department,
        manager_id: manager_id || null,
        employment_date: new Date(employment_date),
      },
    });

    res.status(200).json({ user: user, employee: employeeUpdated });
  } catch (error) {
    const { user_id } = req.user;

    await errorLogs({
      error_message: error.message,
      error_type: 'UpdateAdminError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};

// Get List of Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { roles: { has: 'admin' } }, // Only get user with roles admin
      include: {
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    const { user_id } = req.user;
    
    await errorLogs({
      error_message: error.message,
      error_type: 'GetAllAdminError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};

// Get List of Active Admins
exports.getActiveAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          has: 'admin',
        },
        is_active: true,
      },
      include: {
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    const { user_id } = req.user;
    
    await errorLogs({
      error_message: error.message,
      error_type: 'GetActiveAdminError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};

// Get List of Non-active Admins
exports.getNonactiveAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          has: 'admin'
        },
        is_active: false,
      },
      include: {
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    const { user_id } = req.user;
    
    await errorLogs({
      error_message: error.message,
      error_type: 'GetNonactiveAdminError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const admin = await prisma.user.findUnique({
      where: { user_id },
    });

    if (admin) {
      res.status(200).json(admin);
    } else {
      res.status(404).json({ error: 'Admin not found' });
    }
  } catch (error) {
    const { user_id } = req.user;
    
    await errorLogs({
      error_message: error.message,
      error_type: 'GetAdminByIdError',
      user_id,
    });
    
    res.status(500).json({ error: error.message });
  }
};

// Get Admin by User Login
exports.getAdminByUserId = async (req, res) => {
  const { user_id } = req.user;
  
  try {
    const admin = await prisma.user.findFirst({
      where: { user_id },
      include: {
        assignedBy: true,
      },
    });

    if (admin) {
      res.status(200).json(admin);
    } else {
      res.status(404).json({ error: 'Admin not found' });
    }
  } catch (error) {
    
    await errorLogs({
      error_message: error.message,
      error_type: 'GetAdminByIdError',
      user_id,
    });
    
    res.status(500).json({ error: error.message });
  }
};

// Delete Admin (hard delete)
exports.deleteAdmin = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    // Delete employee data
    const employee = await prisma.employee.delete({
      where: { user_id },
    });

    // Delete admin data
    const user = await prisma.user.delete({
      where: { user_id },
    });

    res.status(204).send();
  } catch (error) {
    const { user_id } = req.user;

    await errorLogs({
      error_message: error.message,
      error_type: 'DeleteAdminError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};