import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StudyDetailsPage from './pages/StudyDetailsPage';
import TopicsPage from './pages/TopicsPage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="app-container">
                    <Navbar />
                    <main>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                            <Route path="/new-plan" element={<ProtectedRoute><StudyDetailsPage /></ProtectedRoute>} />
                            <Route path="/plans/:id/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
