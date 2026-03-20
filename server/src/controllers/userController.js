const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const QuizResult = require('../models/QuizResult');

/**
 * Get top 10 users by XP for the leaderboard
 * @route GET /api/users/leaderboard
 */
const getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find({})
            .sort({ xp: -1 }) // Sort descending by XP
            .limit(10)
            .select('full_name email xp currentStreak');

        res.json(topUsers);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ detail: 'Failed to fetch leaderboard' });
    }
};

/**
 * Get current user's profile details
 * @route GET /api/users/profile
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ detail: 'Failed to fetch profile' });
    }
};

/**
 * Get current user's learning statistics
 * @route GET /api/users/stats
 */
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Total Study Plans
        const totalPlans = await StudyPlan.countDocuments({ user: userId });

        // Completed Topics
        const plans = await StudyPlan.find({ user: userId });
        let completedTopics = 0;
        let totalTopics = 0;
        plans.forEach(plan => {
            if (plan.topics && plan.topics.length > 0) {
                plan.topics.forEach(topic => {
                    totalTopics++;
                    if (topic.completed) completedTopics++;
                });
            }
        });

        // Total Quizzes and Average Score
        const quizzes = await QuizResult.find({ user: userId });
        const totalQuizzes = quizzes.length;
        const avgScore = totalQuizzes > 0 
            ? Math.round(quizzes.reduce((acc, q) => acc + q.percentage, 0) / totalQuizzes)
            : 0;

        res.json({
            totalPlans,
            completedTopics,
            totalTopics,
            totalQuizzes,
            avgScore
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ detail: 'Failed to fetch statistics' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { full_name, daily_reminders, study_hours } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (full_name !== undefined) user.full_name = full_name;
        if (daily_reminders !== undefined) user.daily_reminders = daily_reminders;
        if (study_hours !== undefined) user.study_hours = study_hours;

        await user.save();
        
        // Return without password
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ detail: 'Failed to update profile' });
    }
};

/**
 * Update current user's password
 * @route PUT /api/users/password
 */
const bcrypt = require('bcryptjs');

const updateUserPassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        if (!current_password || !new_password) {
            return res.status(400).json({ detail: 'Please provide both current and new passwords' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ detail: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(new_password, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ detail: 'Failed to update password' });
    }
};

module.exports = { getLeaderboard, getUserProfile, getUserStats, updateUserProfile, updateUserPassword };
