const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to generate recap
const generateAttendanceRecap = async () => {
  try {
    const officeSettings = await prisma.officeSettings.findFirst();

    // If settings data is found
    if (officeSettings) {
      const recapDay = officeSettings.monthly_recap_day;

      // Schedule cron based on recapDay
      cron.schedule(`0 0 ${recapDay} * *`, async () => {
        console.log(`Generating attendance recap for month on day ${recapDay}`);
        
        // Monthly attendance recap logic (see previous section)
        const employees = await prisma.employee.findMany();
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        for (const employee of employees) {
          const { employee_id } = employee;

          const attendances = await prisma.attendance.findMany({
            where: {
              employee_id,
              date: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1),
              },
            },
          });

          const totalDaysPresent = attendances.filter(a => a.status === 'present').length;
          const totalDaysAbsent = attendances.filter(a => a.status === 'absent').length;
          const totalDaysLate = attendances.filter(a => a.status === 'late').length;
          const totalWorkHours = attendances.reduce((acc, curr) => {
            if (curr.clock_out_time) {
              const workHours = (new Date(curr.clock_out_time) - new Date(curr.clock_in_time)) / 3600000;
              return acc + workHours;
            }
            return acc;
          }, 0);

          await prisma.attendanceRecap.upsert({
            where: {
              employee_id_month_year: {
                employee_id,
                month,
                year,
              },
            },
            update: {
              total_days_present: totalDaysPresent,
              total_days_absent: totalDaysAbsent,
              total_days_late: totalDaysLate,
              total_work_hours: totalWorkHours,
              updated_at: new Date(),
            },
            create: {
              employee_id,
              month,
              year,
              total_days_present: totalDaysPresent,
              total_days_absent: totalDaysAbsent,
              total_days_late: totalDaysLate,
              total_work_hours: totalWorkHours,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        console.log('Attendance recap completed successfully');
      });
    }
  } catch (error) {
    console.error('Error setting up cron job:', error);
  }
};

module.exports = generateAttendanceRecap;