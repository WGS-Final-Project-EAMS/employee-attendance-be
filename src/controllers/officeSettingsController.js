const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const errorLogs = require('../utils/errorLogs');

// Get Office Settings
exports.getOfficeSettings = async (req, res) => {
    const { user_id } = req.user;
    
    try {
        const settings = await prisma.officeSettings.findFirst();
        if (!settings) {
            return res.status(404).json({ message: "Office settings not found" });
        }
        res.status(200).json(settings);
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'GetOffeceSettingError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Update Office Settings
exports.updateOfficeSettings = async (req, res) => {
    const { office_start_time, office_end_time, office_location } = req.body;
    var { monthly_recap_day } = req.body;
    const { user_id } = req.user; // Assuming req.user contains user info from authentication middleware
    
    try {
        // Convert monthly_recap_day to integer if it's a string
        if (!Number.isInteger(monthly_recap_day)) {
            monthly_recap_day = parseInt(monthly_recap_day);
        }

        // Get the first record of office settings
        const officeSetting = await prisma.officeSettings.findFirst({
            orderBy: { created_at: 'asc' }, // Get the first row created
        });

        if (!officeSetting) {
            return res.status(404).json({ message: "Office settings not found." });
        }

        const updatedSettings = await prisma.officeSettings.update({
            where: { settings_id: officeSetting.settings_id }, 
            data: {
                office_start_time,
                office_end_time,
                office_location,
                monthly_recap_day,
            },
        });
        res.status(200).json({ message: "Office settings updated successfully", updatedSettings });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'UpdateOfficeSettingsError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Create Office Settings
exports.createOfficeSettings = async (req, res) => {
    const { office_start_time, office_end_time, office_location } = req.body;
    var { monthly_recap_day } = req.body;
    const { user_id } = req.user;

    try {

        // Convert monthly_recap_day to integer if it's a string
        if (!Number.isInteger(monthly_recap_day)) {
            monthly_recap_day = parseInt(monthly_recap_day);
        }

        const newSettings = await prisma.officeSettings.create({
            data: {
                office_start_time,
                office_end_time,
                office_location,
                monthly_recap_day,
            },
        });
        res.status(201).json({ message: "Office settings created successfully", newSettings });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'CreateOfficeSettingsError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};

// Delete Office Settings
exports.deleteOfficeSettings = async (req, res) => {
    const { user_id } = req.user; // Assuming req.user contains user info from authentication middleware

    try {
        // Get the first record of office settings
        const officeSetting = await prisma.officeSettings.findFirst({
            orderBy: { created_at: 'asc' }, // Get the first row created
        });

        if (!officeSetting) {
            return res.status(404).json({ message: "Office settings not found." });
        }

        await prisma.officeSettings.delete({
            where: { settings_id: officeSetting.settings_id },
        });

        res.status(200).json({ message: "Office settings deleted successfully" });
    } catch (error) {
        await errorLogs({
            error_message: error.message,
            error_type: 'DeleteOfficeSettingsError',
            user_id,
        });

        res.status(500).json({ error: error.message });
    }
};