import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from './components/Toast';
import './App.css';

// Lazy-loaded pages — each splits into its own JS chunk (better initial load)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const StudyDetailsPage = lazy(() => import('./pages/StudyDetailsPage'));
const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const DailyPlanPage = lazy(() => import('./pages/DailyPlanPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const QuizReviewPage = lazy(() => import('./pages/QuizReviewPage'));

function PageLoader() {
    return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ScrollToTop />
                <div className="app-container">
                    <ToastContainer />
                    <Navbar />
                    <main>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                                <Route path="/new-plan" element={<ProtectedRoute><StudyDetailsPage /></ProtectedRoute>} />
                                <Route path="/plans/:id/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
                                <Route path="/plans/:id/daily-plan" element={<ProtectedRoute><DailyPlanPage /></ProtectedRoute>} />
                                <Route path="/plans/:id/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="/review/:id" element={<ProtectedRoute><QuizReviewPage /></ProtectedRoute>} />
                            </Routes>
                        </Suspense>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
