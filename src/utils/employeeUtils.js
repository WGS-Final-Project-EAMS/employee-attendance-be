const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to get employee details by user_id
async function getEmployeeByUserId(user_id) {
    try {
        // Fetch employee by user_id
        const employee = await prisma.employee.findFirst({
            where: {
                user_id,
            },
        });

        // If employee not found, return null
        if (!employee) {
            return null;
        }

        return employee;
    } catch (error) {
        console.error('Error fetching employee by user_id:', error.message);
        throw new Error('Unable to fetch employee details.');
    }
}

module.exports = {
    getEmployeeByUserId,
};