const express = require('express');
const router = express.Router();
const {
    generateFlashcards,
    getDueFlashcards,
    getAllFlashcards,
    submitReview,
    deleteFlashcard
} = require('../controllers/flashcardController');
const auth = require('../middleware/auth');

router.post('/:planId/generate', auth, generateFlashcards);
router.get('/:planId/due', auth, getDueFlashcards);
router.get('/:planId/all', auth, getAllFlashcards);
router.post('/review/:cardId', auth, submitReview);
router.delete('/:cardId', auth, deleteFlashcard);

module.exports = router;
