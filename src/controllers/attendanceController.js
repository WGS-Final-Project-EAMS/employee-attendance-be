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

        // Get office settings (for office_start_time)
        const officeSettings = await prisma.officeSettings.findFirst();

        if (!officeSettings) {
            return res.status(400).json({ error: "Office settings not found." });
        }

        const officeStartTime = officeSettings.office_start_time;

        // Convert office_start_time to a Date object for today's date
        const [startHour, startMinute] = officeStartTime.split(':');
        const officeStartDateTime = new Date();
        officeStartDateTime.setHours(startHour, startMinute, 0, 0);

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

        // Get current clock-in time
        const clockInTime = new Date();

        // Determine attendance status based on office_start_time
        let status = 'present';
        if (clockInTime > officeStartDateTime) {
            status = 'late';
        }

        // Fetch current streak data
        const currentStreakData = await prisma.streak.findFirst({
            where: {
                employee_id: employee.employee_id,
            },
        });

        // Initialize streak values
        let currentStreak = currentStreakData ? currentStreakData.current_streak : 0;
        let longestStreak = currentStreakData ? currentStreakData.longest_streak : 0;
        let lastStreakDate = currentStreakData ? new Date(currentStreakData.last_streak_date) : null;

        // Streak logic - update streak only if status is 'present'
        if (status === 'present') {
            const yesterday = new Date();
            yesterday.setDate(today.getUTCDate() - 1);

            // If no attendance yesterday or last streak was not yesterday, reset streak
            if (!lastStreakDate || lastStreakDate < yesterday) {
                currentStreak = 1; // Reset streak to 1
            } else {
                currentStreak += 1; // Increment streak
            }

            // Update longest streak if needed
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }

            // If streak data exists, update it
            if (currentStreakData) {
                await prisma.streak.update({
                    where: { streak_id: currentStreakData.streak_id }, // Use streak_id for update
                    data: {
                        current_streak: currentStreak,
                        longest_streak: longestStreak,
                        last_streak_date: today,
                        reset_reason: 'none',
                        updated_at: new Date(),
                    },
                });
            } else {
                // If no streak data exists, create a new streak record
                await prisma.streak.create({
                    data: {
                        employee_id: employee.employee_id,
                        current_streak: currentStreak,
                        longest_streak: longestStreak,
                        last_streak_date: today,
                        reset_reason: 'none',
                        last_reset_date: new Date(), // Reset logic could be added here for custom resets
                    },
                });
            }
        } else {
            // Reset streak if late
            if (currentStreakData) {
                await prisma.streak.update({
                    where: { streak_id: currentStreakData.streak_id }, // Use streak_id for reset
                    data: {
                        current_streak: 0,
                        last_streak_date: today,
                        reset_reason: 'late',
                        last_reset_date: new Date(),
                    },
                });
            } else {
                // If no streak data exists, create a new streak record with reset streak
                await prisma.streak.create({
                    data: {
                        employee_id: employee.employee_id,
                        current_streak: 0,
                        longest_streak: longestStreak,
                        last_streak_date: today,
                        last_reset_date: new Date(),
                        reset_reason: 'late',
                    },
                });
            }
        }

        // Create attendance record
        const attendance = await prisma.attendance.create({
            data: {
                employee_id: employee.employee_id,
                clock_in_time: clockInTime,
                date: today,
                status: status, // 'present' or 'late'
                streak_updated: true, // Indicate that streak has been updated
            },
        });

        res.status(201).json({ message: "Clocked in successfully", attendance, currentStreak, longestStreak });
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

// Check Attendance Status for Today
exports.checkAttendanceStatus = async (req, res) => {
    const { user_id } = req.user;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get employee by user_id
        const employee = await getEmployeeByUserId(user_id);

        // Check attendance status for today
        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.employee_id,
                date: today,
            },
        });

        if (!attendance) {
            return res.status(200).json({ status: "no_clock_in" });
        }

        if (attendance.clock_out_time) {
            return res.status(200).json({ status: "clocked_out" });
        }

        return res.status(200).json({ status: "clocked_in" });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'CheckAttendanceStatusError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Get today's attendance for the logged-in employee
exports.getTodayAttendance = async (req, res) => {
    const { user_id } = req.user;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get employee by user_id
        const employee = await getEmployeeByUserId(user_id);

        // Fetch today's attendance for the employee
        const todayAttendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.employee_id,
                date: today,
            },
        });

        if (!todayAttendance) {
            return res.status(404).json({ message: "No attendance record found for today." });
        }

        res.status(200).json(todayAttendance);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetTodayAttendanceError',
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