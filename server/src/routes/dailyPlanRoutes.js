const express = require('express');
const router = express.Router();
const { generateDailyPlan, getDailyPlan } = require('../controllers/dailyPlanController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/:id/generate-plan', generateDailyPlan);
router.get('/:id/daily-plan', getDailyPlan);

module.exports = router;
