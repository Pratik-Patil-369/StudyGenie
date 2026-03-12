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

module.exports = { getLeaderboard, getUserProfile, getUserStats };
