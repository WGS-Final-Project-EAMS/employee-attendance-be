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

// Cancel clock-out
exports.cancelClockOut = async (req, res) => {
    const { user_id } = req.user;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get employee by user_Id
        const employee = await getEmployeeByUserId(user_id);

        // Check if clock out exists for today
        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.employee_id,
                date: today,
                clock_out_time: { not: null }, // Check if already clocked out
            },
        });

        if (!attendance) {
            return res.status(400).json({ error: "No clock-out record found or clock out not yet recorded." });
        }

        // Update attendance record, setting clock_out_time to null
        const updatedAttendance = await prisma.attendance.update({
            where: { attendance_id: attendance.attendance_id },
            data: {
                clock_out_time: null,
            },
        });

        res.status(200).json({ message: "Clock-out has been canceled", updatedAttendance });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'CancelClockOutError',
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
    const { period, start_date, end_date, date, month, year } = req.query;
    const { user_id } = req.user;

    try {
        let recaps;

        if (period === 'daily') {
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);
            
            recaps = await prisma.attendance.findMany({
                where: {
                    date: selectedDate,
                },
                include: {
                    employee: {
                        include: {
                            user: true,
                            // position: true,
                            
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
                        include: {
                            user: true,
                            // position: true,
                        },
                    },
                },
            });
        } else if (period === 'period') {
            if (!start_date || !end_date) {
                return res.status(400).json({ error: 'Both start_date and end_date must be provided for period-based recap.' });
            }

            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999); // To include the whole end date

            const attendances = await prisma.attendance.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    employee: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            recaps = attendances.reduce((acc, attendance) => {
                const employeeId = attendance.employee_id;
        
                // Check if the employee already exists in the recaps array
                let recap = acc.find(r => r.employee_id === employeeId);
                if (!recap) {
                    // If not, create a new recap object for the employee
                    recap = {
                        recap_id: `${employeeId}-${start_date}-${end_date}`, // or any unique ID
                        employee: attendance.employee,
                        total_days_present: 0,
                        total_days_absent: 0,
                        total_days_late: 0,
                        total_work_hours: 0,
                    };
                    acc.push(recap);
                }
        
                // Update the recap object based on attendance status
                if (attendance.status === 'present') {
                    recap.total_days_present += 1;
                } else if (attendance.status === 'absent') {
                    recap.total_days_absent += 1;
                } else if (attendance.status === 'late') {
                    recap.total_days_late += 1;
                }
        
                // Calculate work hours if the employee has clocked out
                if (attendance.clock_in_time && attendance.clock_out_time) {
                    const workHours = (new Date(attendance.clock_out_time) - new Date(attendance.clock_in_time)) / 3600000;
                    recap.total_work_hours += workHours;
                }
        
                return acc;
            }, []);
        } else {
            return res.status(400).json({ error: 'Invalid period type. Use "daily", "monthly", or "period".' });
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
            res.attachment(`${date}-${month}-${year}-attendance-recap.csv`);
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

exports.checkAbsentEmployees = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ambil semua employee yang belum clock-in hari ini
        const absentEmployees = await prisma.employee.findMany({
            where: {
                attendance: {
                    none: {
                        date: today,
                    },
                },
                leaveRequest: {
                    none: {
                        start_date: { lte: today },
                        end_date: { gte: today },
                        status: 'approved',
                    },
                },
            },
            include: {
                attendance: true,
            },
        });

        for (const employee of absentEmployees) {
            // Jika tidak clock-in dan tidak ada izin, maka tandai absent
            await prisma.attendance.create({
                data: {
                    employee_id: employee.id,
                    date: today,
                    status: 'absent',
                },
            });
        }
    } catch (error) {
        console.error('Error checking absent employees:', error);
    }
};