const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlan',
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    // SRS (SuperMemo-2) fields
    interval: {
        type: Number,
        default: 0 // In days
    },
    repetition: {
        type: Number,
        default: 0 // Number of successful reviews
    },
    easeFactor: {
        type: Number,
        default: 2.5 // Starting ease factor
    },
    nextReviewDate: {
        type: Date,
        default: Date.now
    },
    bundleName: {
        type: String,
        default: 'Default Bundle'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient retrieval of due cards
flashcardSchema.index({ userId: 1, studyPlanId: 1, nextReviewDate: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
