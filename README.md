# 🧞‍♂️ StudyGenie: AI-Integrated Personalized Study Planner

StudyGenie is a modern, high-performance web application designed to revolutionize student productivity using Artificial Intelligence. It generates customized study plans, adaptive quizzes, and provides a gamified experience to keep learners motivated.

---

## 🎨 Premium UI/UX
The application features a **Sleek Dark Mode** with **Glassmorphic** design elements, providing a premium, focused environment for students.

## 🚀 Key Features

### 🧠 AI-Driven Intelligence
- **Personalized Study Plans**: Generates 1–30 day study plans based on topic difficulty and user goals.
- **Adaptive Quizzes**: AI generates questions dynamically to match the user's current knowledge level.
- **🤖 "Explain This" AI Tutor**: Instant, detailed AI explanations for any quiz error, helping users understand the *why* behind their mistakes.

### 🎮 Gamification & Motivation
- **XP & Leaderboard**: Earn Experience Points (XP) by completing quizzes and climb the global ranks.
- **🔥 Study Streaks**: Visual streak tracking to encourage daily consistency.
- **User Profile Statistics**: Comprehensive analytics on completion rates, average scores, and academic growth.

### ⏱️ Productivity Utilities
- **Pomodoro Timer**: A built-in focus timer with interactive progress rings and automated break logic.
- **📅 Calendar Export**: One-click `.ics` export to sync study sessions with Google Calendar, Outlook, or Apple Calendar.
- **Quiz Review & Retake**: Revisit past quiz attempts, study old answers, and instantly retake targeted concepts.

---

## 🛠️ Technical Stack & AI Infrastructure

### **Advanced AI Engine**
StudyGenie uses a sophisticated **Multi-Provider AI Fallback Strategy** (`aiService.js`). It can be configured to use:
- **Local AI (Ollama)**: Primary support for privacy-first, local model execution (e.g., Llama 3, Mistral).
- **High-Speed Cloud (Groq)**: Uses Llama 3 on Groq for sub-second adaptive quiz generation.
- **Large Context (Gemini)**: Google's Gemini 1.5 for complex study plan synthesis.
*The system automatically cascades through providers (Local -> Groq -> Gemini) to ensure 100% uptime.*

### **Stack**
- **Frontend**: React (Vite) + TypeScript, glassmorphism CSS, Recharts.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt.
- **Automation**: `node-cron` for scheduled morning study reminders.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

# AI Configuration
AI_PROVIDER=auto # Options: auto, local, groq, gemini
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key

# Email Reminders (Nodemailer)
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 📂 Project Architecture
- `/client`: React source code, components, hooks, and premium styling.
- `/server`: Express API, Mongoose models, AI services, and authentication middleware.

## 🤝 Contribution
This project was developed as part of the Infosys Springboard Internship 2025.

---

**Happy Studying with StudyGenie!** 🧞‍♂️✨