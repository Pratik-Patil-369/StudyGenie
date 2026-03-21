require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const dailyPlanRoutes = require('./routes/dailyPlanRoutes');
const quizRoutes = require('./routes/quizRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { startEmailScheduler } = require('./utils/emailScheduler');
const config = require('./config');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth', authRoutes);
app.use('/api/study-plans', aiLimiter, syllabusRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/study-plans', aiLimiter, dailyPlanRoutes);
app.use('/api/quizzes', aiLimiter, quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flashcards', aiLimiter, flashcardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', aiLimiter, chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'StudyGenie API is running' });
});

startEmailScheduler();

const PORT = Number(config.port) || 8000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Robust error handling for production
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
