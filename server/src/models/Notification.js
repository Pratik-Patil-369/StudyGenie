const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['study_plan_ready', 'daily_reminder', 'streak_milestone', 'system'],
        default: 'system'
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // auto-delete after 30 days
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
