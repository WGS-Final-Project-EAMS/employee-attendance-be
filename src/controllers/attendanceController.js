const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Clock-in
exports.clockIn = async (req, res) => {
    const { user_id } = req.user;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get employee by user_Id
        const employees = await prisma.employee.findFirst({
            where: { user_id },
            select: { employee_id: true },
        });
        
        // Check if already clocked in today
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employees.employee_id,
                date: today,
            },
        });

        if (existingAttendance) {
            return res.status(400).json({ error: "Already clocked in today." });
        }

        const attendance = await prisma.attendance.create({
            data: {
                employee_id: employees.employee_id,
                clock_in_time: new Date(),
                date: today,
                status: 'present',
            },
        });

        res.status(201).json({ message: "Clocked in successfully", attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// // Clock-out
// exports.clockOut = async (req, res) => {
//     const { user_id } = req.user;

//     try {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const attendance = await prisma.attendance.findFirst({
//             where: {
//                 user_id,
//                 date: today,
//                 NOT: { clock_out_time: null },
//             },
//         });

//         if (!attendance) {
//             return res.status(400).json({ error: "No clock-in record found for today or already clocked out." });
//         }

//         const updatedAttendance = await prisma.attendance.update({
//             where: { id: attendance.id },
//             data: {
//                 clock_out_time: new Date(),
//             },
//         });

//         res.status(200).json({ message: "Clocked out successfully", updatedAttendance });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get attendance history
// exports.getAttendanceHistory = async (req, res) => {
//     const { user_id } = req.user;

//     try {
//         const attendanceHistory = await prisma.attendance.findMany({
//             where: { user_id },
//             orderBy: { date: 'desc' },
//         });

//         res.status(200).json(attendanceHistory);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
