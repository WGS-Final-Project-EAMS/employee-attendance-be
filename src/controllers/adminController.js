const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const { profile } = require('console');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const errorLogs = require('../utils/errorLogs');

// Create Admin
exports.createAdmin = async (req, res) => {
  const errors = validationResult(req);
  const errorMessages = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
  }, {});

  if (!errors.isEmpty()) {
      return res.status(400).json({ error: errorMessages });
  }

  try {
      const { username, role, email, assigned_by, full_name, phone_number } = req.body;
      const profilePictureUrl = req.file ? req.file.path : null;
      const length = 12;
      
      const password_hash = crypto.randomBytes(Math.ceil(length / 2))
          .toString('hex') // Convert to hexadecimal format
          .slice(0, length); // Return required number of characters
          
      // Hash the password
      // const password_hash = await bcrypt.hash(password, 10);
      
      // Create a new user
      const user = await prisma.user.create({
          data: {
              username,
              password_hash,
              role,
              email,
          },
      });
      
      // Create admin management entry
      const admin = await prisma.adminManagement.create({
          data: {
              user_id: user.user_id,
              assigned_by,
              role,
              full_name,
              phone_number,
              profile_picture_url: profilePictureUrl,
          },
      });
  
      res.status(201).json(admin);
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
  const { admin_id } = req.params;
  const { user_id, username, email, assigned_by, updated_by, full_name, phone_number } = req.body;
  const is_active = req.body.is_active === "true";
  
  const profilePictureUrl = req.file ? req.file.path : null;
  // const updated_by = req.user.user_id;
  
  try {
    // Pastikan admin dengan admin_id ada
    const existingAdmin = await prisma.adminManagement.findUnique({
      where: { admin_id },
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
      },
    });

    // Update admin data
    const updatedAdmin = await prisma.adminManagement.update({
      where: { admin_id },
      data: {
        user: { connect: { user_id } },
        assignedBy: { connect: { user_id: assigned_by } },  // Relasi assignedBy
        updated_by,
        full_name,
        phone_number,
        profile_picture_url: profilePictureUrl || existingAdmin.profile_picture_url,
      },
    });

    res.json(updatedAdmin);
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


// Delete Admin (hard delete)
exports.deleteAdmin = async (req, res) => {
  const { admin_id } = req.params;
  
  try {
    const admin = await prisma.adminManagement.findUnique({
      where: { admin_id },
      select: { user_id: true }
    });

    // Delete admin data
    await prisma.adminManagement.delete({
      where: { admin_id },
    });

    // Delete user data
    await prisma.user.delete({
      where: { user_id: admin.user_id },
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

// Get List of Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.adminManagement.findMany({
      include: {
        user: true,  // include user data for each employee
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.json(admins);
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
    const admins = await prisma.adminManagement.findMany({
      where: {
        user: {
          is_active: true
        }
      },
      include: {
        user: true,  // include user data for each employee
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.json(admins);
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
    const admins = await prisma.adminManagement.findMany({
      where: {
        user: {
          is_active: false
        }
      },
      include: {
        user: true,  // include user data for each employee
        assignedBy: true, // include user assigner data for each employee
      },
    });
    res.json(admins);
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
  const { admin_id } = req.params;
  
  try {
    const admin = await prisma.adminManagement.findUnique({
      where: { admin_id },
    });
    if (admin) {
      res.json(admin);
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