const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECRET_KEY = process.env.SECRET_KEY; // Gantilah dengan key yang lebih aman dan simpan di environment variable

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Compare the provided password with the stored hash
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        const isPasswordValid = (inputPassword, storedPassword) => {
            return inputPassword === storedPassword;
        };

        if (!isPasswordValid(password, user.password_hash)) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
            },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
