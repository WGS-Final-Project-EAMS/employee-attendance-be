const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { transport } = require('../utils/emailTransporter');
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

// Forgot Password
exports.resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new password
    const length = 12;
    const newPassword = crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await prisma.user.update({
      where: { email },
      data: { password_hash: newPasswordHash }
    });

    // Prepare email content
    const text = `
      Dear ${user.full_name || 'User'},
      
      Your password has been successfully reset. Below are your new login credentials:
      
      Email: ${email}
      Password: ${newPassword}
      
      Please keep this information secure and do not share it with anyone.
      You can log in using the above credentials.
      
      Best regards,
      The Ngabsen Team
    `;

    const mailOptions = {
      from: 'no_reply@email.com',
      to: email,
      subject: 'Your password has been reset',
      text
    };

    // Send the new password to user's email
    transport.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log({ error: error.message });
        return res.status(500).json({ error: 'Failed to send email' });
      } else {
        console.log('Email sent: ' + info.response);
        return res.status(200).json({ message: 'Password reset successfully. Check your email for the new password.' });
      }
    });
  } catch (error) {
    // Log the error
    await errorLogs({
      error_message: error.message,
      error_type: 'ForgotPasswordError',
      user_id: null,  // User might not be logged in
    });

    res.status(500).json({ error: 'Internal server error' });
  }
};