const express = require('express');
const router = express.Router();
const { getPlans, deletePlan } = require('../controllers/studyPlanController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getPlans);
router.delete('/:id', deletePlan);

module.exports = router;
