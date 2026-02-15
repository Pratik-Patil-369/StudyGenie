const express = require('express');
const router = express.Router();
const { createPlanWithFile, getTopics, updateTopics, downloadFile } = require('../controllers/syllabusController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', createPlanWithFile);
router.get('/:id/topics', getTopics);
router.put('/:id/topics', updateTopics);
router.get('/:id/download', downloadFile);

module.exports = router;
