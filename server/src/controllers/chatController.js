const { generateWithAI } = require('../utils/aiService');
const { extractJSON } = require('../utils/extractJSON');

const handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ detail: 'Message is required' });
        }

        let contextText = '';
        if (history && Array.isArray(history) && history.length > 0) {
            // Take the last 6 messages to keep context window small
            const recentHistory = history.slice(-6);
            contextText = 'Previous conversation:\n' + recentHistory.map(h => `${h.role === 'user' ? 'User' : 'StudyGenie'}: ${h.content}`).join('\n') + '\n\n';
        }

        const prompt = `You are StudyGenie, an expert AI study assistant. Your goal is to help a student understand their course material, answer academic questions, and provide study tips. Keep your answers concise, encouraging, and highly educational. Format your response cleanly using markdown if necessary, but keep it brief as this is a limited-space chat widget.

${contextText}User: ${message}

Respond to the user. You MUST return your response STRICTLY as a JSON object with a single key "response" containing your reply text.
Example: {"response": "Hello! I can help you with that..."}`;

        const aiResult = await generateWithAI(prompt);
        let replyText = aiResult.text;
        
        try {
            const parsed = extractJSON(replyText);
            if (parsed && parsed.response) {
                replyText = parsed.response;
            }
        } catch(e) {
            // fallback to raw text if JSON parsing fails
        }

        res.json({ response: replyText, provider: aiResult.provider });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ detail: 'Failed to generate chat response: ' + error.message });
    }
};

module.exports = { handleChat };
