const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const adminRoutes = require('./routers/adminRoutes');
const authRoutes = require('./routers/authRoutes');
const userRoutes = require('./routers/userRoutes');
const employeeRoutes = require('./routers/employeeRoutes');
const attendanceRoutes = require('./routers/attendanceRoutes');
const leaveRequestRoutes = require('./routers/leaveRequestRoutes');
const officeSettingsRoutes = require('./routers/officeSettingsRoutes');
const streakRoutes = require('./routers/streakRoutes');
const errorLogRoutes = require('./routers/errorLogRoutes');
const path = require('path');

const app = express();

dotenv.config();

const PORT = process.env.PORT;
const IP_ADRESS = process.env.IP_ADRESS;

// Morgan
app.use(morgan('dev'));

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Mengizinkan semua origin
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); // Mengizinkan semua metode HTTP

    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    next();
});

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', employeeRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', leaveRequestRoutes);
app.use('/api', officeSettingsRoutes);
app.use('/api', streakRoutes);
app.use('/api', errorLogRoutes);

// Default empty routes
app.use('/', (req, res) => {
    res.status(404)
    res.send('PAGE NOT FOUND: 404')
})

app.listen(PORT, () => {
    console.log(`App listening on ${IP_ADRESS}:${PORT}/`);
})