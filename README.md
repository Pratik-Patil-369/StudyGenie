# 🧞‍♂️ StudyGenie: AI-Integrated Personalized Study Planner

StudyGenie is a modern, high-performance web application designed to revolutionize student productivity using Artificial Intelligence. It generates customized study plans, adaptive quizzes, and provides a gamified experience to keep learners motivated.

---

## 🎨 Premium UI/UX
The application features a **Sleek Dark Mode** with **Glassmorphic** design elements, providing a premium, focused environment for students.

## 🚀 Key Features

### 🧠 AI-Driven Intelligence
- **Personalized Study Plans**: Generates 1–30 day study plans based on topic difficulty and user goals.
- **Adaptive Quizzes**: AI generates questions dynamically to match the user's current knowledge level.
- **🤖 "Explain This" AI Tutor**: Instant, detailed AI explanations for any quiz error, featuring precision-sanitized JSON for 100% reliability.
- **🔐 Secure Authentication**: Multi-factor OTP email verification and one-click Google SSO integration.

### 🎮 Gamification & Motivation
- **XP & Leaderboard**: Earn Experience Points (XP) by completing quizzes and climb the global ranks.
- **🔥 Study Streaks**: Visual streak tracking to encourage daily consistency.
- **User Profile Statistics**: Comprehensive analytics on completion rates, average scores, and academic growth.

### ⏱️ Productivity Utilities
- **3D AI Flashcards**: Spaced Repetition (SRS) based study cards with premium 3D flip animations.
- **📚 Clean Topic Lists**: Collapsible subtopic organization to handle massive syllabi without clutter.
- **Pomodoro Timer**: A built-in focus timer with interactive progress rings and automated break logic.
- **📅 Calendar Export**: One-click `.ics` export to sync study sessions with Google Calendar, Outlook, or Apple Calendar.

---

## 🛠️ Technical Stack & AI Infrastructure

### **Advanced AI Engine**
StudyGenie uses a sophisticated **Multi-Provider AI Fallback Strategy** (`aiService.js`). It can be configured to use:
- **Local AI (Ollama)**: Primary support for privacy-first, local model execution (e.g., Llama 3, Mistral).
- **High-Speed Cloud (Groq)**: Uses Llama 3 on Groq for sub-second adaptive quiz generation.
- **Large Context (Gemini)**: Google's Gemini 1.5 for complex study plan synthesis.
*The system automatically cascades through providers (Local -> Groq -> Gemini) to ensure 100% uptime.*

### **Stack**
- **Frontend**: React (Vite) + TypeScript / Tailwind CSS / Lucide / Recharts / Sonner.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt, Google Auth Library.
- **Email**: Custom SMTP integration with professional HTML templates.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (for SSO)

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

# Google SSO
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI Configuration
AI_PROVIDER=auto # auto, local, groq, gemini
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key

# Email Verification (SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
EMAIL_FROM="StudyGenie <your_email>"
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id
```
Start the frontend:
```bash
npm run dev
```

---

## 📂 Project Architecture
The project is built with a **Modular MVC Architecture**:
- `/client`: React source code with isolated context providers and custom hooks.
- `/server`: Express API with distinct controllers, middlewares, and AI service layers.

## 🤝 Contribution
This project was developed as part of the Infosys Springboard Internship 2025.

---

**Happy Studying with StudyGenie!** 🧞‍♂️✨