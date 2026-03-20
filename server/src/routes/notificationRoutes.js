const express = require('express');
const router = express.Router();
const { sendDailyReminder, getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');

// POST /api/notifications/daily-reminder
router.post('/daily-reminder', authenticate, sendDailyReminder);

// GET /api/notifications
router.get('/', authenticate, getNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, markAsRead);

module.exports = router;
