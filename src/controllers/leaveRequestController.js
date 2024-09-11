const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const errorLogs = require('../utils/errorLogs');

// Create a new leave request
exports.createLeaveRequest = async (req, res) => {
    const { user_id } = req.user;
    const { leave_type, start_date, end_date, leave_reason } = req.body;

    try {
        // Fetch employee_id by user_id
        const employee = await prisma.employee.findFirst({
            where: { user_id },
            select: { employee_id: true, manager_id: true },
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Create new leave request
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employee_id: employee.employee_id,
                manager_id: employee.manager_id, // Assign to manager
                leave_type,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                leave_reason,
                status: 'pending',
            },
        });

        res.status(201).json({ message: "Leave request submitted", leaveRequest });
    } catch (error) {
        const { user_id } = req.user;
        await errorLogs({
            error_message: error.message,
            error_type: 'LeaveRequestError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
};

// Approve or reject a leave request
exports.updateLeaveRequestStatus = async (req, res) => {
    const { leave_request_id } = req.params;
    const { status } = req.body;  // 'approved' or 'rejected'
    const { user_id } = req.user;

    try {
        const employee = await prisma.employee.findFirst({
            where: { user_id },
            select: { employee_id: true }
        });

        // Fetch leave request
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { leave_request_id },
        });

        if (!leaveRequest) {
            return res.status(404).json({ error: "Leave request not found" });
        }

        // Only manager can approve/reject
        if (leaveRequest.manager_id !== employee.employee_id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Update leave request status
        const updatedLeaveRequest = await prisma.leaveRequest.update({
            where: { leave_request_id },
            data: { status },
        });

        res.status(200).json({ message: `Leave request ${status}`, updatedLeaveRequest });
    } catch (error) {
        const { user_id } = req.user;
        await errorLogs({
            error_message: error.message,
            error_type: 'LeaveRequestStatusUpdateError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
};

// Get leave requests for a specific employee
exports.getEmployeeLeaveRequests = async (req, res) => {
    const { user_id } = req.user;

    try {
        const employee = await prisma.employee.findFirst({
            where: { user_id },
            select: { employee_id: true },
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Fetch leave requests
        const leaveRequests = await prisma.leaveRequest.findMany({
            where: { employee_id: employee.employee_id },
            include: { employee: true, manager: true },
            orderBy: { created_at: 'desc' },
        });

        res.status(200).json({ leaveRequests });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetEmployeeLeaveRequestsError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
};

// Get leave requests for specific manager
exports.getApprovalList = async (req, res) => {
    const { user_id } = req.user;

    try {
        const employee = await prisma.employee.findFirst({
            where: { user_id },
            select: { employee_id: true },
        });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Fetch leave requests
        const approvalList = await prisma.leaveRequest.findMany({
            where: { manager_id: employee.employee_id },
            include: { employee: true, manager: true },
            orderBy: { created_at: 'desc' },
        });

        res.status(200).json({ approvalList });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetEmployeeLeaveRequestsError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
};