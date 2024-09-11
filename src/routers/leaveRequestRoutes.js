const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequestController');
const { authenticateRole } = require('../middleware/authMiddleware');

// Create a new leave request (for employees)
router.post('/leave-requests', authenticateRole('employee'), leaveRequestController.createLeaveRequest);

// Get leave requests by employee
router.get('/leave-requests', authenticateRole('employee'), leaveRequestController.getEmployeeLeaveRequests);

// Get leave requests by manager
router.get('/approval', authenticateRole('employee'), leaveRequestController.getApprovalList);

// Approve or reject a leave request (for managers/approvers)
router.patch('/leave-requests/:leave_request_id/status', authenticateRole('employee'), leaveRequestController.updateLeaveRequestStatus);

// Approve or reject a leave request (for managers/approvers)
router.delete('/leave-requests/:leave_request_id', authenticateRole('employee'), leaveRequestController.cancelLeaveRequest);

module.exports = router;