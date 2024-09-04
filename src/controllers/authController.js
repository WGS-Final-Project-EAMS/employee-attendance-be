// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();
const errorLogs = require('../utils/errorLogs');

const SECRET_KEY = process.env.SECRET_KEY; // Gantilah dengan key yang lebih aman dan simpan di environment variable

// Login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    const errorMessages = errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
    }, {});

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errorMessages });
    }

    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: { general: "Invalid email or password" } });
        }

        // Compare the provided password with the stored hash
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        const isPasswordValid = (inputPassword, storedPassword) => {
            return inputPassword === storedPassword;
        };

        if (!isPasswordValid(password, user.password_hash)) {
            return res.status(401).json({ error: { general: "Invalid email or password" } });
        }

        const isUserActive = (status) => {
            return status;
        }

        if (!isUserActive(user.is_active)) {
            return res.status(401).json({ error: { general: "Your account is inactive" } });
        }

        // Generate JWT token
        const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
        },
            SECRET_KEY,
        { expiresIn: '7h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'LoginError',
        });

        res.status(500).json({ error: error.message });
    }
};

exports.access_resource = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    //Authorization: 'Bearer TOKEN'
    if (!token) {
      res.status(200).json(
        {
          success: false,
          message: "Error!Token was not provided."
        }
      );
    }
    //Decoding the token
    const decodedToken = jwt.verify(token, SECRET_KEY);
    res.status(200).json(
      {
        success: true,
        data: {
          userId: decodedToken.userId,
          email: decodedToken.email
        }
      }
    );
};

exports.logout = async (req, res) => {
    try {
        // Menghapus token dari client-side
        res.clearCookie('token', { httpOnly: true });

        // Menyediakan respons sukses
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        // Menangani kesalahan
        await errorLogs({
            error_message: error.message,
            error_type: 'LogoutError',
        });
        res.status(500).json({ error: error.message });
    }
}
