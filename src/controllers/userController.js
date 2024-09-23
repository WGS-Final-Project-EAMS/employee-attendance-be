const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const errorLogs = require('../utils/errorLogs');

// Get List of User
exports.getAllUsers = async (req, res) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      
      await errorLogs({
        error_message: error.message,
        error_type: 'LoginError',
      });

      res.status(500).json({ error: error.message });
    }
};
  
// Get User by User id
exports.getUserById = async (req, res) => {
  const { user_id } = req.user;
  try {
    const user = await prisma.user.findMany({
      where: { user_id },
    });

    res.json(user);
  } catch (error) {
    
    await errorLogs({
      error_message: error.message,
      error_type: 'LoginError',
    });

    res.status(500).json({ error: error.message });
  }
};

// Change password 
exports.changePassword = async (req, res) => {
  const { user_id } = req.user;  // Get user ID from JWT token
  const { newPassword, confirmPassword } = req.body;

  // Is new password match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    // Hash the password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updatedUser = await prisma.user.update({
      where: { user_id },
      data: { password_hash },
    });

    // If success
    if (updatedUser) {
      return res.status(200).json({ message: "Password changed successfully" });
    }

  } catch (error) {
    await errorLogs({
      error_message: error.message,
      error_type: 'ChangePasswordError',
      user_id,
    });

    res.status(500).json({ error: error.message });
  }
};