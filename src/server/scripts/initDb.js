require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Default users if environment variables are not set
const defaultUsers = [
  { username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' },
  { username: process.env.USER1_USERNAME || 'user1', password: process.env.USER1_PASSWORD || 'pass123', role: 'user' },
  { username: process.env.USER2_USERNAME || 'user2', password: process.env.USER2_PASSWORD || 'pass123', role: 'user' }
];

// Generate additional test users
const additionalUsers = Array.from({ length: 7 }, (_, i) => ({
  username: `user${i + 3}`,
  password: 'pass123',
  role: 'user'
}));

const users = [...defaultUsers, ...additionalUsers];

async function initializeDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create new users
    const createdUsers = await Promise.all(
      users.map(async userData => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        return user.save();
      })
    );

    console.log(`Created ${createdUsers.length} users successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDb();