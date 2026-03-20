const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    total_questions: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    answers: [{
        question_index: Number,
        selected_option: String,
        is_correct: Boolean
    }],
    completed_at: {
        type: Date,
        default: Date.now
    }
});

quizResultSchema.index({ user: 1 });
quizResultSchema.index({ quiz: 1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
