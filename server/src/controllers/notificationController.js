const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const { sendDailyReminderEmail } = require('../utils/emailService');

/**
 * POST /api/notifications/daily-reminder
 * Manually triggers a daily reminder email for the logged-in user.
 */
const sendDailyReminder = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ detail: 'User not found' });

        // Find the requested plan (or default to first plan with a daily plan)
        const planId = req.body.planId;
        const query = planId
            ? { _id: planId, user: req.user.id }
            : { user: req.user.id, 'daily_plan.0': { $exists: true } };

        const plan = await StudyPlan.findOne(query);
        if (!plan || !plan.daily_plan?.length) {
            return res.status(400).json({ detail: 'No daily plan found. Generate a daily plan first.' });
        }

        // Find today's task
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayTask = plan.daily_plan.find(task => {
            const d = new Date(task.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });

        // If no exact match, use the first upcoming task
        if (!todayTask) {
            todayTask = plan.daily_plan.find(task => new Date(task.date) >= today)
                || plan.daily_plan[0];
        }

        if (!todayTask || !todayTask.topics.length) {
            return res.status(400).json({ detail: 'No topics found for today in this plan.' });
        }

        const result = await sendDailyReminderEmail(
            user,
            todayTask.topics,
            plan,
            todayTask.duration_hours,
            todayTask.difficulty
        );

        if (!result.success) {
            return res.status(500).json({
                detail: result.reason === 'Email not configured'
                    ? 'Email not configured on server. Please set EMAIL_USER and EMAIL_PASS in your .env file.'
                    : 'Failed to send email: ' + result.reason
            });
        }

        res.json({ message: `Daily reminder sent to ${user.email}` });
    } catch (error) {
        console.error('Notification error:', error.message);
        res.status(500).json({ detail: 'Server error: ' + error.message });
    }
};

const Notification = require('../models/Notification');

/**
 * Get all notifications for the current user
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ detail: 'Failed to fetch notifications' });
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ detail: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ detail: 'Failed to update notification' });
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ detail: 'Failed to update notifications' });
    }
};

module.exports = { sendDailyReminder, getNotifications, markAsRead, markAllAsRead };
