const axios = require('axios');

const errorLogs = async ({ error_message, error_type, user_id }) => {
    try {
        await axios.post(`${process.env.BASE_URL}/api/error-logs`, {
            error_message,
            error_type,
            user_id,
        });
    } catch (error) {
        console.error('Failed to log error:', error.message);
    }
};

module.exports = errorLogs;