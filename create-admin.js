const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/ntando-hosting');
        console.log('Connected to MongoDB');

        // Delete any existing admin user
        await User.deleteMany({ role: 'admin' });
        console.log('Cleared existing admin users');

        // Create admin user
        const admin = new User({
            username: 'Ntando',
            email: 'admin@ntando.app',
            password: 'Ntando',
            role: 'admin',
            plan: 'admin',
            permissions: {
                canManageUsers: true,
                canViewAllSites: true,
                canDeleteUsers: true,
                canModifyPlans: true,
                unlimitedSites: true,
                unlimitedStorage: true
            }
        });

        // Hash password and save
        await admin.save();
        
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

createAdmin();