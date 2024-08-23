const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // Pastikan Anda menggunakan SECRET_KEY yang sama seperti pada login

// Middleware generik untuk memeriksa peran
exports.authenticateRole = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ error: `Authorization header is missing.` });
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(token, SECRET_KEY);

            if (decoded.role !== requiredRole) {
                return res.status(403).json({ error: `Access denied. ${requiredRole} only.` });
            }

            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid or expired token.' });
        }
    };
};
