import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from './components/Toast';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const StudyDetailsPage = lazy(() => import('./pages/StudyDetailsPage'));
const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const DailyPlanPage = lazy(() => import('./pages/DailyPlanPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const QuizReviewPage = lazy(() => import('./pages/QuizReviewPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FlashcardPage = lazy(() => import('./pages/FlashcardPage'));
const OTPPage = lazy(() => import('./pages/OTPPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <ScrollToTop />
                    <ToastContainer position="top-center" expand={false} richColors />
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/verify-otp" element={<OTPPage />} />
                            <Route path="/*" element={
                                <ProtectedRoute>
                                    <ErrorBoundary>
                                        <Layout>
                                            <Routes>
                                                <Route index element={<HomePage />} />
                                                <Route path="/dashboard" element={<HomePage />} />
                                                <Route path="/new-plan" element={<StudyDetailsPage />} />
                                                <Route path="/plans/:id/topics" element={<TopicsPage />} />
                                                <Route path="/plans/:id/daily-plan" element={<DailyPlanPage />} />
                                                <Route path="/plans/:id/quiz" element={<QuizPage />} />
                                                <Route path="/profile" element={<ProfilePage />} />
                                                <Route path="/review/:id" element={<QuizReviewPage />} />
                                                <Route path="/analytics" element={<AnalyticsPage />} />
                                                <Route path="/leaderboard" element={<LeaderboardPage />} />
                                                <Route path="/plans/:id/flashcards" element={<FlashcardPage />} />
                                                <Route path="/settings" element={<SettingsPage />} />
                                                <Route path="*" element={<NotFoundPage />} />
                                            </Routes>
                                        </Layout>
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
