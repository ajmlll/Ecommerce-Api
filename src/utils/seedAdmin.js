const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Check if any admin user already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log(`[Seed] Admin user already exists: ${adminExists.email}`);
      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });

    console.log('[Seed] Successfully created default Admin user:');
    console.log(`       Email:    ${adminUser.email}`);
    console.log(`       Password: ${adminPassword}`);
    console.log(`       Role:     ${adminUser.role}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed admin user: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
