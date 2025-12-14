const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function initializeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ntando-hosting');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log(`Username: ${existingAdmin.username}`);
            console.log(`Email: ${existingAdmin.email}`);
            process.exit(0);
        }

        // Create admin user
        const admin = await User.createAdmin('Ntando', 'admin@ntando.app', 'Ntando');
        
        console.log('✅ Admin user created successfully!');
        console.log('📋 Login Credentials:');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: Ntando`);
        console.log(`   Role: ${admin.role}`);
        console.log('\n🌐 Access the admin panel at: http://localhost:3000/admin.html');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

// Run the initialization
initializeAdmin();