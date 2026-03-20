const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');
require('dotenv').config();

async function migrateUsers() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studygenie';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { isVerified: { $exists: false } }, // Update users who don't have the field yet
            { $set: { isVerified: true } }
        );

        const result2 = await User.updateMany(
            { isVerified: false }, // Also catch those who were defaulted to false but are old
            { $set: { isVerified: true } }
        );

        console.log(`Successfully updated ${result.modifiedCount + result2.modifiedCount} users to verified status.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateUsers();
