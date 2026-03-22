require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  aiProvider: process.env.AI_PROVIDER || 'auto',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  isProduction: process.env.NODE_ENV === 'production',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  // Email config
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || '',
  // Google SSO
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  bypassOTP: process.env.BYPASS_OTP === 'true',
};
