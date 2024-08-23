const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');

// exports.createUser = async (req, res) => {
//     try {
//         const { username, role, email } = req.body;
//         const password_hash = await bcrypt.hash(password, 10);
//         const user_id = await prisma.user.create({
//             data: {
//                 username,
//                 password_hash,
//                 role,
//                 email,
//             },
//         });
//         res.status(201).json(user_id);
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
// }

// Get List of User
exports.getAllUsers = async (req, res) => {
    try {
      const users = await prisma.User.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };