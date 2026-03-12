const express = require('express');
const router = express.Router();
const { sendDailyReminder } = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');

// POST /api/notifications/daily-reminder
router.post('/daily-reminder', authenticate, sendDailyReminder);

module.exports = router;
