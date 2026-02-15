require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const config = require('./config');

connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/study-plans', syllabusRoutes);
app.use('/api/study-plans', studyPlanRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'StudyGenie API is running' });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
