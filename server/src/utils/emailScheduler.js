const cron = require('node-cron');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const { sendDailyReminderEmail } = require('./emailService');
const config = require('../config');

/**
 * Sends daily reminder emails to all users at 8:00 AM.
 * Finds today's tasks in each user's active study plans.
 */
async function sendDailyRemindersToAll() {
    if (!config.emailUser || !config.emailPass) {
        console.log('[Scheduler] Email not configured — skipping daily reminders.');
        return;
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const users = await User.find({});
        console.log(`[Scheduler] Sending daily reminders to ${users.length} users...`);

        for (const user of users) {
            try {
                const plans = await StudyPlan.find({ user: user._id });

                for (const plan of plans) {
                    if (!plan.daily_plan || plan.daily_plan.length === 0) continue;

                    // Find today's task
                    const todayTask = plan.daily_plan.find(task => {
                        const taskDate = new Date(task.date);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate.getTime() === today.getTime();
                    });

                    if (todayTask && todayTask.topics.length > 0) {
                        await sendDailyReminderEmail(
                            user,
                            todayTask.topics,
                            plan,
                            todayTask.duration_hours,
                            todayTask.difficulty
                        );
                        break; // Only send one email per user (first matching plan)
                    }
                }
            } catch (err) {
                console.error(`[Scheduler] Failed for user ${user.email}:`, err.message);
            }
        }

        console.log('[Scheduler] Daily reminder run complete.');
    } catch (err) {
        console.error('[Scheduler] Error in daily reminder job:', err.message);
    }
}

/**
 * Starts the daily reminder cron job.
 * Runs every day at 8:00 AM server local time.
 */
function startEmailScheduler() {
    if (!config.emailUser || !config.emailPass) {
        console.log('[Scheduler] Email not configured — scheduler disabled.');
        return;
    }

    // '0 8 * * *' = every day at 08:00 AM
    cron.schedule('0 8 * * *', () => {
        console.log('[Scheduler] Running daily reminder job at 8:00 AM...');
        sendDailyRemindersToAll();
    });

    console.log('[Scheduler] Daily email reminder scheduled for 8:00 AM every day.');
}

module.exports = { startEmailScheduler, sendDailyRemindersToAll };
