const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
// const prisma = require("./db/prisma");
const adminRoutes = require('./routers/adminRoutes');

const app = express();

dotenv.config();

const PORT = process.env.PORT;
const IP_ADRESS = process.env.IP_ADRESS;

// Morgan
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', adminRoutes);

app.get('/', (req, res) => {
    res.send('Express JS Ready');
})

// app.post('/api/admin', async (req, res) => {
//     try {
//         const {username, role, email, fullName, phoneNumber, profilePicUrl} = req.body;
//         const access = req.access;
//         const errors = validationResult(req);

//         if (access !== 'super-admin') return res.json('Only super admin can access this');
    
//         if (!errors.isEmpty()) return res.status(200).json(errors.array());

//         const hashPassword = await bcrypt.hash(password, 10);
//         const newAdmin = await prisma.user.create({
//             data: {
//                 name, email, password: hashPassword, phoneNumber, isActive: true, access: 'admin'
//             }
//         });

//         res.status(201);
//         res.json({
//             newAdmin,
//             msg: 'Admin successfulyy added!'
//         })
//     } catch (error) {
//         console.log(error);
//         handleError(null, error.message, res);
//     }
// })

app.listen(PORT, () => {
    console.log(`App listening on ${IP_ADRESS}:${PORT}/`);
})