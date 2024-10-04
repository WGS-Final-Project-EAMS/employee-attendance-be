const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getEmployeeByUserId } = require('../utils/employeeUtils');
const errorLogs = require('../utils/errorLogs');

// Get all streaks
exports.getAllStreaks = async (req, res) => {
    const { user_id } = req.user;

    try {
        const streaks = await prisma.streak.findMany({
            include: {
                employee: true, // Include employee details if needed
            },
        });

        res.status(200).json(streaks);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetAllStreakError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get streak by employee_id
exports.getStreakByEmployeeId = async (req, res) => {
    const { user_id } = req.user;
    const { employee_id } = req.params;

    try {
        const streak = await prisma.streak.findFirst({
            where: {
                employee_id,
            },
            include: {
                employee: true, // Include employee details if needed
            },
        });

        if (!streak) {
            return res.status(404).json({ message: 'Streak not found for the given employee ID.' });
        }

        res.status(200).json(streak);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetStreakByEmployeeError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get streak by user_id (logged-in user)
exports.getStreakByUserId = async (req, res) => {
    const { user_id } = req.user;

    try {
        // Get employee by user ID
        const employee = await getEmployeeByUserId(user_id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found for the given user ID.' });
        }

        // Fetch streak for the employee
        const streak = await prisma.streak.findFirst({
            where: {
                employee_id: employee.employee_id,
            },
            include: {
                employee: true, // Include employee details if needed
            },
        });

        if (!streak) {
            return res.status(404).json({ message: 'Streak not found for the given user ID.' });
        }

        res.status(200).json(streak);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetStreakByUserError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Reset streak by employee_id
exports.resetStreak = async (req, res) => {
    const { user_id } = req.user;
    const { employee_id } = req.params;
    const { reset_reason } = req.body; // Include the reason for resetting streak

    try {
        const streak = await prisma.streak.findFirst({
            where: {
                employee_id,
            },
        });

        if (!streak) {
            return res.status(404).json({ message: 'Streak not found for the given employee ID.' });
        }

        // Reset the streak
        const updatedStreak = await prisma.streak.update({
            where: {
                streak_id: streak.streak_id,
            },
            data: {
                current_streak: 0,
                last_reset_date: new Date(),
                reset_reason, // Reason can be like 'MANUAL_RESET', 'ADMIN_RESET', etc.
            },
        });

        res.status(200).json({ message: 'Streak reset successfully.', streak: updatedStreak });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'ResetStreakError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get streak for a specific period
exports.getStreakByDateRange = async (req, res) => {
    const { user_id } = req.user;
    const { employee_id, start_date, end_date } = req.query;

    try {
        const streaks = await prisma.streak.findMany({
            where: {
                employee_id,
                last_streak_date: {
                    gte: new Date(start_date),
                    lte: new Date(end_date),
                },
            },
        });

        res.status(200).json(streaks);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetStreakByDateRangeError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};