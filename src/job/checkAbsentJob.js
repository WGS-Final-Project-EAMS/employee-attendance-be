const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkAbsentEmployees } = require('../controllers/attendanceController');

const checkAbsentSchedule = async () => {
    try {
        const officeSettings = await prisma.officeSettings.findFirst();
        const endTime = officeSettings.office_end_time;
        const [endHour, endMinute] = endTime.split(':');

        // Run at office end time daily (change according to office end time)
        cron.schedule(`0 ${endHour} * * *`, async () => {
            console.log('Running daily absent check...');
            await checkAbsentEmployees();
        });

    } catch (error) {
        console.error('Error checking absent employees:', error);
    }
}

module.exports = checkAbsentSchedule;