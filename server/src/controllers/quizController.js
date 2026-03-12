const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const { generateWithAI, explainQuestion } = require('../utils/aiService');
const { extractJSON } = require('../utils/extractJSON');
const { sendProgressEmail } = require('../utils/emailService');

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
const getAdaptiveDifficulty = async (userId) => {
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
        // Optional: caller can pass specific topics (e.g. day-wise quiz from DailyPlanPage)
        const requestedTopics = req.body?.topics;

        const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
        if (!plan) return res.status(404).json({ detail: 'Study plan not found' });

        let quizTopics;

        if (requestedTopics && Array.isArray(requestedTopics) && requestedTopics.length > 0) {
            // Day-wise quiz: use the specific topics passed by the caller
            quizTopics = requestedTopics;
        } else {
            // Adaptive quiz: use all completed topics
            const completedTopics = plan.topics.filter(t => t.completed).map(t => t.name);
            if (completedTopics.length === 0) {
                return res.status(400).json({ detail: 'Complete at least one topic to generate a quiz!' });
            }
            quizTopics = completedTopics;
        }

        const difficulty = await getAdaptiveDifficulty(req.user.id);

        const prompt = `
            Generate a multiple-choice quiz based on these study topics: ${quizTopics.join(', ')}.
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
            topics: quizTopics,
            difficulty,
            questions
        });

        await newQuiz.save();

        res.json({
            message: 'Quiz generated successfully',
            quizId: newQuiz._id,
            questions: newQuiz.questions,
            difficulty: newQuiz.difficulty,
            topics: quizTopics
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

        // Save quiz score first
        await result.save();

        // -------------------------
        // FEATURE: STREAK TRACKING
        // -------------------------
        const userDoc = await User.findById(req.user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!userDoc.lastActivityDate) {
            // First ever activity
            userDoc.currentStreak = 1;
            userDoc.lastActivityDate = today;
        } else {
            const lastActivity = new Date(userDoc.lastActivityDate);
            lastActivity.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(today - lastActivity);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Activity was yesterday, increment streak
                userDoc.currentStreak += 1;
                userDoc.lastActivityDate = today;
            } else if (diffDays > 1) {
                // Streak broken, reset to 1
                userDoc.currentStreak = 1;
                userDoc.lastActivityDate = today;
            }
            // If diffDays === 0, they already studied today, streak stays the same.
        }

        // FEATURE: XP SYSTEM
        userDoc.xp = (userDoc.xp || 0) + Math.round(percentage);
        
        await userDoc.save();


        // ── AUTO-MARK TOPICS AS DONE IF SCORE >= 80% ──────────────────────
        let autoMarkedTopics = [];
        if (percentage >= 80 && quiz.topics && quiz.topics.length > 0 && quiz.study_plan) {
            try {
                const plan = await StudyPlan.findById(quiz.study_plan);
                if (plan) {
                    let updated = false;
                    quiz.topics.forEach(quizTopic => {
                        const match = plan.topics.find(
                            t => !t.completed && t.name.toLowerCase() === quizTopic.toLowerCase()
                        );
                        if (match) {
                            match.completed = true;
                            autoMarkedTopics.push(match.name);
                            updated = true;
                        }
                    });
                    if (updated) await plan.save();
                }
            } catch (err) {
                console.error('[AutoMark] Failed to auto-mark topics:', err.message);
            }
        }

        // Fire-and-forget progress email (don't block response)
        User.findById(req.user.id).then(user => {
            if (user) {
                sendProgressEmail(user, result, quiz.difficulty, quiz.topics).catch(() => {});
            }
        }).catch(() => {});

        res.json({
            message: 'Quiz submitted successfully',
            score,
            total: quiz.questions.length,
            percentage,
            review: processedAnswers,
            autoMarkedTopics  // topics auto-completed due to >= 80% score
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

// ── GET EXPLANATION FOR A QUESTION ──────────────────────────────
const explainAnswer = async (req, res) => {
    try {
        const { question, options, correctAnswer, userAnswer, topic } = req.body;
        
        if (!question || !correctAnswer) {
            return res.status(400).json({ detail: 'Missing required question data' });
        }

        const explanation = await explainQuestion(topic || 'General', question, options || [], correctAnswer, userAnswer);
        
        res.json({ explanation });
    } catch (error) {
        console.error('Explanation Error:', error);
        res.status(500).json({ detail: 'Failed to generate explanation' });
    }
};

// ── GET SINGLE QUIZ RESULT ──────────────────────────────────────
const getQuizResult = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await QuizResult.findOne({ _id: id, user: req.user.id })
            .populate('quiz');
        
        if (!result) {
            return res.status(404).json({ detail: 'Quiz result not found' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Fetch Result Error:', error);
        res.status(500).json({ detail: 'Failed to fetch quiz result' });
    }
};

module.exports = { generateQuiz, submitQuiz, getQuizHistory, explainAnswer, getQuizResult };
