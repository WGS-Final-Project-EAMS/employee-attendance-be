const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const errorLogs = require('../utils/errorLogs');

// Get notification by user_id
exports.getNotification = async (req, res) => {
    const { user_id } = req.user;

    try {
        const notification = await prisma.notification.findMany({
            where: { user_id },
            include: { user: true }
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const unreadCount = await prisma.notification.count({
            where: {
                user_id,
                is_read: false,
            },
        });

        res.status(200).json({ totalItems: notification.length, unreadCount, notification });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetNotificationError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
}

// Update notificatoin status
exports.updateNotification = async (req, res) => {
    const { user_id } = req.user;

    try {
        // Update semua notifikasi yang belum dibaca (is_read: false) untuk user yang bersangkutan
        const updateResult = await prisma.notification.updateMany({
            where: {
                user_id: user_id,
                is_read: false, // Hanya notifikasi yang belum dibaca
            },
            data: {
                is_read: true, // Mengubah status menjadi terbaca
            },
        });

        if (updateResult.count === 0) {
            return res.status(404).json({ message: "No unread notifications found for this user" });
        }

        res.status(200).json({
            message: `${updateResult.count} notification(s) marked as read.`,
        });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'UpdateNotificationError',
            user_id,
        });
        res.status(500).json({ error: error.message });
    }
}