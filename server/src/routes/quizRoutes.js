const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.post('/:planId/generate-quiz', auth, quizController.generateQuiz);
router.post('/submit-quiz/:quizId', auth, quizController.submitQuiz);
router.get('/quiz-history', auth, quizController.getQuizHistory);
router.get('/result/:id', auth, quizController.getQuizResult);
router.post('/explain', auth, quizController.explainAnswer);

module.exports = router;
