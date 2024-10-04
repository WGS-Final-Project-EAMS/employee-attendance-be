const bcrypt = require('bcrypt');
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
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
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
            roles: user.roles,
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

// Login as Admin
exports.loginAdmin = async (req, res) => {
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

        // Check if the user has admin or super_admin role
        if (!user.roles.includes('admin') && !user.roles.includes('super_admin')) {
            return res.status(403).json({ error: { general: "Access denied. Admin only." } });
        }

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: { general: "Invalid email or password" } });
        }

        if (!user.is_active) {
            return res.status(401).json({ error: { general: "Your account is inactive" } });
        }

        // Generate JWT token with admin/super_admin role
        const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            roles: user.roles.includes('super_admin') ? 'super_admin' : 'admin',  // Store 'admin' or 'super_admin'
        },
            SECRET_KEY,
        { expiresIn: '7h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'LoginAdminError',
        });

        res.status(500).json({ error: error.message });
    }
};


// Login as Employee
exports.loginEmployee = async (req, res) => {
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

        // Check if the user has employee role
        if (!user.roles.includes('employee')) {
            return res.status(403).json({ error: { general: "Access denied. Employee only." } });
        }

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: { general: "Invalid email or password" } });
        }

        if (!user.is_active) {
            return res.status(401).json({ error: { general: "Your account is inactive" } });
        }

        // Generate JWT token with employee role
        const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            roles: 'employee',  // Store 'employee' role
        },
            SECRET_KEY,
        { expiresIn: '7h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'LoginEmployeeError',
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
          user_id: decodedToken.user_id,
          email: decodedToken.email,
          roles: decodedToken.roles,
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
