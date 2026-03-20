const Flashcard = require('../models/Flashcard');
const StudyPlan = require('../models/StudyPlan');
const { generateWithAI } = require('../utils/aiService');
const { extractJSON } = require('../utils/extractJSON');

/**
 * SuperMemo-2 Algorithm for Spaced Repetition
 * @param {number} quality - User rating from 0 (completely forgot) to 5 (perfect recall)
 * @param {Object} card - The flashcard document
 * @returns {Object} Updated SRS fields
 */
const updateSRS = (quality, card) => {
    let { interval, repetition, easeFactor } = card;

    if (quality >= 3) {
        // Success
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
    } else {
        // Failure
        repetition = 0;
        interval = 1;
    }

    // Update Ease Factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return { interval, repetition, easeFactor, nextReviewDate };
};

const generateFlashcards = async (req, res) => {
    try {
        const { planId } = req.params;
        const { topics, bundleName } = req.body;

        const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
        if (!plan) return res.status(404).json({ detail: 'Study plan not found' });

        const selectedTopics = topics || plan.topics.slice(0, 5).map(t => t.name);

        const prompt = `
            Generate 10 flashcards (Question & Answer pairs) based on these study topics: ${selectedTopics.join(', ')}.
            
            Return a JSON array of objects, each with:
            - question (string, concise)
            - answer (string, clear and short)
            - topic (string, which topic this belongs to)
            
            IMPORTANT: Return ONLY valid JSON.
        `;

        const aiResponse = await generateWithAI(prompt);
        const flashcardsData = extractJSON(aiResponse.text);

        if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
            throw new Error('AI failed to generate valid flashcards');
        }

        const newFlashcards = flashcardsData.map(card => ({
            userId: req.user.id,
            studyPlanId: planId,
            question: card.question || card.q,
            answer: card.answer || card.a,
            topic: card.topic || selectedTopics[0],
            bundleName: bundleName || `Bundle_${new Date().toLocaleDateString('en-GB')}`,
            nextReviewDate: new Date()
        }));

        const savedCards = await Flashcard.insertMany(newFlashcards);

        res.json({
            message: `${savedCards.length} flashcards generated in bundle "${bundleName || 'Default'}"`,
            flashcards: savedCards
        });

    } catch (error) {
        console.error('Flashcard Gen Error:', error.message);
        res.status(500).json({ detail: 'Failed to generate flashcards: ' + error.message });
    }
};

const getDueFlashcards = async (req, res) => {
    try {
        const { planId } = req.params;
        const { topic, bundle } = req.query;
        const now = new Date();

        const query = {
            userId: req.user.id,
            studyPlanId: planId,
            nextReviewDate: { $lte: now }
        };
        if (topic) query.topic = topic;
        if (bundle) query.bundleName = bundle;

        const dueCards = await Flashcard.find(query).sort({ nextReviewDate: 1 });
        res.json(dueCards);
    } catch (error) {
        res.status(500).json({ detail: 'Failed to fetch due flashcards' });
    }
};

const getAllFlashcards = async (req, res) => {
    try {
        const { planId } = req.params;
        const { topic, bundle } = req.query;
        
        const query = {
            userId: req.user.id,
            studyPlanId: planId
        };
        if (topic) query.topic = topic;
        if (bundle) query.bundleName = bundle;

        const cards = await Flashcard.find(query).sort({ createdAt: -1 });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ detail: 'Failed to fetch flashcards' });
    }
};

const submitReview = async (req, res) => {
    try {
        const { cardId } = req.params;
        const { quality } = req.body; // 0-5

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ detail: 'Valid quality score (0-5) is required' });
        }

        const card = await Flashcard.findOne({ _id: cardId, userId: req.user.id });
        if (!card) return res.status(404).json({ detail: 'Flashcard not found' });

        const updates = updateSRS(quality, card);
        Object.assign(card, updates);
        await card.save();

        res.json({
            message: 'Review submitted successfully',
            nextReviewDate: card.nextReviewDate,
            interval: card.interval
        });
    } catch (error) {
        res.status(500).json({ detail: 'Failed to submit review' });
    }
};

const deleteFlashcard = async (req, res) => {
    try {
        const { cardId } = req.params;
        await Flashcard.findOneAndDelete({ _id: cardId, userId: req.user.id });
        res.json({ message: 'Flashcard deleted' });
    } catch (error) {
        res.status(500).json({ detail: 'Failed to delete flashcard' });
    }
};

module.exports = {
    generateFlashcards,
    getDueFlashcards,
    getAllFlashcards,
    submitReview,
    deleteFlashcard
};
