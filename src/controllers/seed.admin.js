require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();
    const exists = await User.findOne({ email: 'admin@umg.edu' });
    if (exists) {
      console.log('Admin ya existe');
      process.exit(0);
    }
    await User.create({
      name: 'Admin UMG',
      email: 'admin@umg.edu',
      password: 'Admin123*',
      role: 'admin'
    });
    console.log('✔ Admin creado: admin@umg.edu / Admin123*');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
