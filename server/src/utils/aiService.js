const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

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
        max_tokens: 4096,
        response_format: { type: 'json_object' }
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

    // Auto / Fallback strategy: Local -> Groq -> Gemini
    const fallbackOrder = ['local', 'groq', 'gemini'];
    
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

module.exports = { generateWithAI };
