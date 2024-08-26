const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Error Log
exports.createErrorLog = async (req, res) => {
    const { error_message, error_type, user_id } = req.body;

    try {
        const errorLog = await prisma.errorLog.create({
            data: {
                error_message,
                error_type,
                error_timestamp: new Date(),
                user_id: user_id || null, // Bisa null jika tidak ada user terkait
            },
        });

        res.status(201).json({ message: 'Error log created successfully', errorLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Error Logs
exports.getErrorLogs = async (req, res) => {
    try {
        const errorLogs = await prisma.errorLog.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                error_timestamp: 'desc',
            },
        });

        res.status(200).json({ errorLogs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Error Log by ID
exports.getErrorLogById = async (req, res) => {
    const { id } = req.params;

    try {
        const errorLog = await prisma.errorLog.findUnique({
            where: { error_log_id: id },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });

        if (!errorLog) {
            return res.status(404).json({ error: 'Error log not found' });
        }

        res.status(200).json({ errorLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};