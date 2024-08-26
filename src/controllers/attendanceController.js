const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');
const errorLogs = require('../utils/errorLogs');

const getEmployeeByUserId = async (user_id) => {
    return await prisma.employee.findFirst({
        where: { user_id },
        select: { employee_id: true },
    });
};

// ===================
// ATTENDANCE TRACKING
// For: employee
// ===================

// Clock-in
exports.clockIn = async (req, res) => {
    const { user_id } = req.user;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get employee by user_Id
        const employee = await getEmployeeByUserId(user_id);
        
        // Check if already clocked in today
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.employee_id,
                date: today,
            },
        });

        if (existingAttendance) {
            return res.status(400).json({ error: "Already clocked in today." });
        }

        const attendance = await prisma.attendance.create({
            data: {
                employee_id: employee.employee_id,
                clock_in_time: new Date(),
                date: today,
                status: 'present',
            },
        });

        res.status(201).json({ message: "Clocked in successfully", attendance });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'ClockInError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Clock-out
exports.clockOut = async (req, res) => {
    const { user_id } = req.user;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const employee = await getEmployeeByUserId(user_id);

        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.employee_id,
                date: today,
                clock_out_time: null,
            },
        });

        if (!attendance) {
            return res.status(400).json({ error: "No clock-in record found for today or already clocked out." });
        }

        const updatedAttendance = await prisma.attendance.update({
            where: { attendance_id: attendance.attendance_id },
            data: {
                clock_out_time: new Date(),
            },
        });

        res.status(200).json({ message: "Clocked out successfully", updatedAttendance });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'ClockOutError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get attendance history
exports.getAttendanceHistory = async (req, res) => {
    const { user_id } = req.user;

    try {
        const employee = await getEmployeeByUserId(user_id);

        const attendanceHistory = await prisma.attendance.findMany({
            where: { employee_id: employee.employee_id },
            orderBy: { date: 'desc' },
        });

        res.status(200).json(attendanceHistory);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'AttendanceHistoryError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
};

// ================
// Attendance Recap
// For: admin
// ================

// Get Attendance Recap (Daily/Monthly)
exports.getAttendanceRecap = async (req, res) => {
    const { period, date, month, year } = req.query;
    const { user_id } = req.user;

    try {
        let recaps;

        if (period === 'daily') {
            const selectedDate = new Date(date);
            recaps = await prisma.attendance.findMany({
                where: {
                    date: selectedDate,
                },
                include: {
                    employee: {
                        select: {
                            full_name: true,
                            department: true,
                            position: true,
                        },
                    },
                },
            });
        } else if (period === 'monthly') {
            recaps = await prisma.attendanceRecap.findMany({
                where: {
                    month: parseInt(month, 10),
                    year: parseInt(year, 10),
                },
                include: {
                    employee: {
                        select: {
                            full_name: true,
                            department: true,
                            position: true,
                        },
                    },
                },
            });
        } else {
            return res.status(400).json({ error: 'Invalid period type. Use "daily" or "monthly".' });
        }

        if (recaps.length === 0) {
            return res.status(404).json({ error: 'No attendance data found for the specified period.' });
        }

        // Convert to CSV if requested
        if (req.query.format === 'csv') {
            const fields = period === 'daily' ? 
                ['employee.full_name', 'employee.department', 'employee.position', 'clock_in_time', 'clock_out_time', 'status', 'date'] :
                ['employee.full_name', 'employee.department', 'employee.position', 'total_days_present', 'total_days_absent', 'total_days_late', 'total_work_hours', 'month', 'year'];

            const parser = new Parser({ fields });
            const csv = parser.parse(recaps);
            res.header('Content-Type', 'text/csv');
            res.attachment(`${period}-attendance-recap.csv`);
            return res.send(csv);
        }

        res.status(200).json({ recaps });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'AttendanceRecapError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};