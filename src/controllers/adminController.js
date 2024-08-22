const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const { profile } = require('console');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

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
      const { username, role, email, assigned_by, full_name, phone_number, profile_picture_url } = req.body;
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
              profile_picture_url,
          },
      });
  
      res.status(201).json(admin);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  const { admin_id } = req.params;
  const { user_id, assigned_by, updated_by, role, full_name, phone_number, profile_picture_url } = req.body;
  // const updated_by = req.user.user_id;
  
  try {
    // Pastikan admin dengan admin_id ada
    const existingAdmin = await prisma.adminManagement.findUnique({
      where: { admin_id },
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Update admin data
    const updatedAdmin = await prisma.adminManagement.update({
      where: { admin_id },
      data: {
        user_id,
        assigned_by,
        updated_by,
        role,
        full_name,
        phone_number,
        profile_picture_url,
      },
    });

    res.json(updatedAdmin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// // Delete Admin
// exports.deleteAdmin = async (req, res) => {
//   const { admin_id } = req.params;
  
//   try {
//     await prisma.adminManagement.delete({
//       where: { admin_id },
//     });
//     res.status(204).send();
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Get List of Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.adminManagement.findMany();
    res.json(admins);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};