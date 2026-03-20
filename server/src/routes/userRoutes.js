const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserProfile, getUserStats, updateUserProfile, updateUserPassword } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard); // optionally auth if needed, but currently protected in frontend or backend
router.get('/profile', auth, getUserProfile);
router.get('/stats', auth, getUserStats);
router.put('/profile', auth, updateUserProfile);
router.put('/password', auth, updateUserPassword);

module.exports = router;
