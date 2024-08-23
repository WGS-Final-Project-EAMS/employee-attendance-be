const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const adminRoutes = require('./routers/adminRoutes');
const authRoutes = require('./routers/authRoutes');
const userRoutes = require('./routers/userRoutes');
const employeeRoutes = require('./routers/employeeRoutes');

const app = express();

dotenv.config();

const PORT = process.env.PORT;
const IP_ADRESS = process.env.IP_ADRESS;

// Morgan
app.use(morgan('dev'));

app.use(express.json());

// API Routes
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', employeeRoutes);

// Default empty routes
app.use('/', (req, res) => {
    res.status(404)
    res.send('PAGE NOT FOUND: 404')
})

app.listen(PORT, () => {
    console.log(`App listening on ${IP_ADRESS}:${PORT}/`);
})