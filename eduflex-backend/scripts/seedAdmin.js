require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function seed() {
  await connectDB(process.env.MONGO_URI);
  const email = 'admin@eduflex.local';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const admin = new User({ name: 'Admin', email, password: 'Admin@123', role: 'admin' });
  await admin.save();
  console.log('Admin created:', admin.email, 'password: Admin@123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
