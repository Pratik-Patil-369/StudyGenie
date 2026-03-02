const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const StudyPlan = require('../models/StudyPlan');
const { generateWithAI } = require('../utils/aiService');
const { extractJSON } = require('../utils/extractJSON');

/**
 * Normalizes AI response for Quizzes
 */
const normalizeQuizResponse = (rawData) => {
    let questions = [];
    if (Array.isArray(rawData)) {
        questions = rawData;
    } else if (typeof rawData === 'object' && rawData !== null) {
        const key = ['questions', 'quiz', 'items'].find(k => Array.isArray(rawData[k]));
        questions = key ? rawData[key] : Object.values(rawData).filter(v => typeof v === 'object');
    }

    return questions.map(q => ({
        question: q.question || q.text || 'Missing Question',
        options: Array.isArray(q.options) ? q.options : [],
        answer: q.answer || q.correct_answer || '',
        explanation: q.explanation || ''
    })).filter(q => q.options.length >= 2 && q.answer);
};

/**
 * Calculates adaptive difficulty based on last result
 */
const getAdaptiveDifficulty = async (userId, planId) => {
    const lastResult = await QuizResult.findOne({ user: userId })
        .sort({ completed_at: -1 })
        .populate('quiz');
    
    if (!lastResult) return 'medium';

    const score = lastResult.percentage;
    if (score >= 85) return 'hard';
    if (score <= 50) return 'easy';
    return 'medium';
};

const generateQuiz = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
        
        if (!plan) return res.status(404).json({ detail: 'Study plan not found' });

        // Find completed topics to quiz on
        const completedTopics = plan.topics.filter(t => t.completed).map(t => t.name);
        
        if (completedTopics.length === 0) {
            return res.status(400).json({ detail: 'Complete at least one topic to generate a quiz!' });
        }

        const difficulty = await getAdaptiveDifficulty(req.user.id, planId);

        const prompt = `
            Generate a multiple-choice quiz based on these study topics: ${completedTopics.join(', ')}.
            Difficulty Level: ${difficulty}
            Number of questions: 5
            
            Return a JSON array of objects, each with:
            - question (string)
            - options (array of 4 strings)
            - answer (exact string from options)
            - explanation (string)
            
            IMPORTANT: Return ONLY valid JSON.
        `;

        const aiResponse = await generateWithAI(prompt);
        
        const rawJson = extractJSON(aiResponse.text);
        const questions = normalizeQuizResponse(rawJson);

        if (questions.length === 0) throw new Error('AI failed to generate valid questions');

        const newQuiz = new Quiz({
            study_plan: planId,
            user: req.user.id,
            topics: completedTopics,
            difficulty,
            questions
        });

        await newQuiz.save();

        res.json({
            message: 'Quiz generated successfully',
            quizId: newQuiz._id,
            questions: newQuiz.questions,
            difficulty: newQuiz.difficulty
        });

    } catch (error) {
        console.error('Quiz Gen Error:', error.message);
        res.status(500).json({ detail: 'Failed to generate quiz: ' + error.message });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body; // Array of { question_index, selected_option }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ detail: 'Quiz not found' });

        let score = 0;
        const processedAnswers = quiz.questions.map((q, idx) => {
            const userAns = answers.find(a => a.question_index === idx);
            const isCorrect = userAns && userAns.selected_option === q.answer;
            if (isCorrect) score++;
            return {
                question_index: idx,
                selected_option: userAns ? userAns.selected_option : null,
                is_correct: isCorrect
            };
        });

        const percentage = (score / quiz.questions.length) * 100;

        const result = new QuizResult({
            quiz: quizId,
            user: req.user.id,
            score,
            total_questions: quiz.questions.length,
            percentage,
            answers: processedAnswers
        });

        await result.save();

        res.json({
            message: 'Quiz submitted successfully',
            score,
            total: quiz.questions.length,
            percentage,
            review: processedAnswers
        });

    } catch (error) {
        res.status(500).json({ detail: 'Submission failed: ' + error.message });
    }
};

const getQuizHistory = async (req, res) => {
    try {
        const results = await QuizResult.find({ user: req.user.id })
            .populate('quiz')
            .sort({ completed_at: -1 })
            .limit(10);
        res.json(results);
    } catch (error) {
        res.status(500).json({ detail: 'Failed to fetch history' });
    }
};

module.exports = { generateQuiz, submitQuiz, getQuizHistory };
