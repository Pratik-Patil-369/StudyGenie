const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { extractJSON } = require('./extractJSON');

/**
 * Generic helper for OpenAI-compatible Chat Completion APIs (Ollama, Groq)
 */
const callChatCompletionAPI = async (url, apiKey, model, prompt, providerName) => {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const body = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
    };

    // Special handling for Ollama's non-standard format if needed
    const isOllamaGenerate = url.includes('/api/generate');
    const requestBody = isOllamaGenerate ? {
        model: model,
        prompt: prompt,
        stream: false,
        format: 'json'
    } : body;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`${providerName} error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = isOllamaGenerate ? data.response : data.choices[0].message.content;

    return { text, provider: providerName.toLowerCase() };
};

const providers = {
    local: async (prompt) => {
        return await callChatCompletionAPI(
            `${config.ollamaUrl}/api/generate`,
            null,
            config.ollamaModel,
            prompt,
            'Local'
        );
    },
    groq: async (prompt) => {
        if (!config.groqApiKey) throw new Error('Groq API Key is missing');
        return await callChatCompletionAPI(
            'https://api.groq.com/openai/v1/chat/completions',
            config.groqApiKey,
            config.groqModel,
            prompt,
            'Groq'
        );
    },
    gemini: async (prompt) => {
        if (!config.geminiApiKey) throw new Error('Gemini API Key is missing');
        
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { text: response.text(), provider: 'cloud-gemini' };
    }
};

const generateWithAI = async (prompt) => {
    const preferredProvider = config.aiProvider.toLowerCase();

    // If a specific provider is forced
    if (providers[preferredProvider] && preferredProvider !== 'auto') {
        return await providers[preferredProvider](prompt);
    }

    // Auto / Fallback strategy: Local -> Groq
    // User requested to disable Gemini as they mainly use Groq
    const fallbackOrder = ['local', 'groq'];
    
    for (const providerKey of fallbackOrder) {
        try {
            console.log(`Attempting generation with ${providerKey}...`);
            return await providers[providerKey](prompt);
        } catch (error) {
            console.warn(`${providerKey} failed:`, error.message);
            // If it was the last provider, throw the error
            if (providerKey === fallbackOrder[fallbackOrder.length - 1]) throw error;
        }
    }

    throw new Error('No valid AI provider succeeded.');
};

const explainQuestion = async (topic, question, options, correctAnswer, userAnswer) => {
    const prompt = `
You are an expert tutor. Please explain the following multiple-choice question clearly and concisely.
Topic: ${topic}
Question: ${question}
Options: ${options.join(', ')}
Correct Answer: ${correctAnswer}
${userAnswer ? `User Answer (Incorrect): ${userAnswer}` : ''}

Provide a short, 2-3 paragraph explanation of WHY the correct answer is right ${userAnswer ? 'and WHY the user answer is wrong' : ''}. Use a friendly, encouraging tone. 
Return your response STRICTLY as a JSON object with a single key "explanation" containing the text. 
IMPORTANT: Use "\\n" for newlines instead of literal newlines to ensure valid JSON.
Example: {"explanation": "Paragraph 1.\\n\\nParagraph 2."}
`;

    try {
        const result = await generateWithAI(prompt);
        const parsed = extractJSON(result.text);
        return parsed.explanation || "Explanation not found in response.";
    } catch (error) {
        console.error('AI Explain Error:', error);
        throw new Error('Failed to generate explanation from AI');
    }
}

module.exports = { generateWithAI, explainQuestion };
