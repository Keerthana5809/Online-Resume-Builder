/**
 * Seed Script - Creates the admin user
 * Run once with: node server/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const ADMIN = {
    name: 'CarizmaX Admin',
    email: 'admin@carizmax.com',
    password: 'Admin@CarizmaX2024!',
    isAdmin: true
};

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
        console.log('Connected!');

        const existing = await User.findOne({ email: ADMIN.email });
        if (existing) {
            console.log('Admin user already exists!');
            console.log('Email:', ADMIN.email);
            console.log('Password:', ADMIN.password);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN.password, salt);

        const admin = new User({
            name: ADMIN.name,
            email: ADMIN.email,
            password: hashedPassword,
            isAdmin: true
        });

        await admin.save();

        console.log('\n✅ Admin user created successfully!');
        console.log('================================');
        console.log('  Email:    admin@carizmax.com');
        console.log('  Password: Admin@CarizmaX2024!');
        console.log('================================\n');
        console.log('Login at: /admin or /login');

    } catch (err) {
        console.error('Error seeding admin:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
