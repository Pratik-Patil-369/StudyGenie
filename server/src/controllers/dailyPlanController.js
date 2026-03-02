const StudyPlan = require('../models/StudyPlan');
const { generateWithAI } = require('../utils/aiService');
const { extractJSON } = require('../utils/extractJSON');

const normalizeAIResponse = (rawData, startDate) => {
    let data = [];

    // 1. Intelligent Extraction
    if (Array.isArray(rawData)) {
        data = rawData;
    } else if (typeof rawData === 'object' && rawData !== null) {
        // Check for common wrapper keys like "study_plan", "daily_plan", "tasks", "plan"
        const wrapperKey = ['study_plan', 'daily_plan', 'tasks', 'plan', 'schedule'].find(k => Array.isArray(rawData[k]));
        
        if (wrapperKey) {
            data = rawData[wrapperKey];
        } else {
            // Fallback for object-as-map (date strings as keys)
            data = Object.values(rawData);
        }
    }

    // 2. Validate and clean each task
    return data.map((task, index) => {
        // Map difficulty to strict enum
        let difficulty = 'medium';
        const rawDiff = String(task.difficulty || '').toLowerCase();
        if (rawDiff.includes('easy')) difficulty = 'easy';
        else if (rawDiff.includes('hard')) difficulty = 'hard';
        else if (rawDiff.includes('med')) difficulty = 'medium';

        // Robust Topic Extraction
        let taskTopics = [];
        if (Array.isArray(task.topics)) taskTopics = task.topics;
        else if (task.topics && typeof task.topics === 'string') taskTopics = [task.topics];
        else if (task.topic) taskTopics = Array.isArray(task.topic) ? task.topic : [task.topic];

        const taskDay = Number(task.day) || (index + 1);

        return {
            day: taskDay,
            date: (() => {
                const fallbackDate = new Date(startDate);
                fallbackDate.setDate(fallbackDate.getDate() + (taskDay - 1));
                if (task.date) {
                    const parsed = new Date(task.date);
                    const year = parsed.getFullYear();
                    // Clamp to sane range — AI sometimes returns year 60301
                    if (!isNaN(parsed) && year >= 2020 && year <= 2099) return parsed;
                }
                return fallbackDate;
            })(),
            topics: taskTopics,
            duration_hours: Number(task.duration_hours || task.duration) || 2,
            difficulty: difficulty,
            notes: task.notes || ''
        };
    });
};

const generateDailyPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
        if (!plan) {
            return res.status(404).json({ detail: 'Study plan not found' });
        }

        const topicsList = plan.topics.map(t => {
            return `- ${t.name}${t.subtopics.length > 0 ? ' (Subtopics: ' + t.subtopics.join(', ') + ')' : ''}`;
        }).join('\n');

        const diffTime = Math.abs(plan.end_date - plan.start_date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const prompt = `
            You are an expert study planner. Create a realistic ${diffDays}-day study schedule.
            
            Subject: ${plan.subject}
            Current Grade: ${plan.current_grade}
            Plan Duration: ${plan.start_date.toDateString()} to ${plan.end_date.toDateString()} (${diffDays} days)
            
            Topics to cover (EVERY SINGLE TOPICS BELOW MUST BE ASSIGNED TO A DAY):
            ${topicsList || 'No topics provided! Please add topics first.'}
            
            Rules:
            1. Generate EXACTLY ${diffDays} days of tasks.
            2. Distribute all topics evenly across ${diffDays} days.
            3. Each day MUST have: day (number), date (YYYY-MM-DD), topics (array), duration_hours (1-4), difficulty (easy/medium/hard), notes.
            4. IMPORTANT: Return ONLY valid JSON (array or object).
        `;

        const aiResponse = await generateWithAI(prompt);
        let dailyPlanTasks;

        try {
            const rawJson = extractJSON(aiResponse.text);
            dailyPlanTasks = normalizeAIResponse(rawJson, plan.start_date);
        } catch (parseError) {
            console.error('AI JSON Parse Error:', parseError.message);
            return res.status(500).json({ detail: 'AI generated invalid formatting. Please try again.' });
        }

        // Save progress
        plan.daily_plan = dailyPlanTasks;
        await plan.save();

        res.json({ 
            message: 'Daily plan generated successfully', 
            daily_plan: plan.daily_plan,
            provider: aiResponse.provider 
        });

    } catch (error) {
        console.error('Generation Error:', error.message);
        res.status(500).json({ detail: 'AI generation failed: ' + error.message });
    }
};

const getDailyPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
        if (!plan) {
            return res.status(404).json({ detail: 'Study plan not found' });
        }

        res.json({ daily_plan: plan.daily_plan || [] });
    } catch (error) {
        res.status(500).json({ detail: 'Server error' });
    }
};

module.exports = { generateDailyPlan, getDailyPlan };
