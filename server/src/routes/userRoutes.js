const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserProfile, getUserStats } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard); // optionally auth if needed, but currently protected in frontend or backend
router.get('/profile', auth, getUserProfile);
router.get('/stats', auth, getUserStats);

module.exports = router;
