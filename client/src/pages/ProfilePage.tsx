import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/api';
import './ProfilePage.css';

interface UserStats {
    totalPlans: number;
    completedTopics: number;
    totalTopics: number;
    totalQuizzes: number;
    avgScore: number;
}

interface QuizResult {
    _id: string;
    quiz: {
        _id: string;
        study_plan: string;
        topics: string[];
    };
    score: number;
    total_questions: number;
    percentage: number;
    completed_at: string;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [history, setHistory] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [statsData, historyData] = await Promise.all([
                apiGet('/users/stats'),
                apiGet('/quizzes/quiz-history')
            ]);
            setStats(statsData);
            setHistory(historyData);
        } catch (error) {
            console.error('Failed to fetch user stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="page-loader-spinner" />
                <p className="page-loader-text">Loading profile...</p>
            </div>
        );
    }

    const completionRate = stats && stats.totalTopics > 0 
        ? Math.round((stats.completedTopics / stats.totalTopics) * 100) 
        : 0;

    return (
        <div className="profile-page">
            <div className="profile-header glass-card">
                <div className="profile-avatar">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h1>{user?.full_name || 'Student'}</h1>
                    <p className="profile-email">{user?.email}</p>
                    <div className="profile-badges">
                        {user?.currentStreak !== undefined && user.currentStreak > 0 && (
                            <span className="badge badge-fire">🔥 {user.currentStreak} Day Streak</span>
                        )}
                        <span className="badge badge-xp">🥇 {user?.xp || 0} XP</span>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-details">
                        <h3>Study Plans</h3>
                        <p className="stat-value">{stats?.totalPlans || 0}</p>
                        <p className="stat-label">Total Created</p>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-details">
                        <h3>Topics Done</h3>
                        <p className="stat-value">{stats?.completedTopics || 0} <span className="stat-of">/ {stats?.totalTopics || 0}</span></p>
                        <p className="stat-label">{completionRate}% Completion Rate</p>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon">🧠</div>
                    <div className="stat-details">
                        <h3>Quizzes Taken</h3>
                        <p className="stat-value">{stats?.totalQuizzes || 0}</p>
                        <p className="stat-label">Total Attempts</p>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-details">
                        <h3>Avg Score</h3>
                        <p className="stat-value">{stats?.avgScore || 0}%</p>
                        <p className="stat-label">Across all quizzes</p>
                    </div>
                </div>
            </div>

            <div className="history-section glass-card" style={{ padding: '2rem', marginTop: '1rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Recent Quizzes</h2>
                
                {history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>You haven't taken any quizzes yet. Generate a study plan to get started!</p>
                ) : (
                    <div className="table-responsive">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Topic(s)</th>
                                    <th>Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item._id}>
                                        <td>{new Date(item.completed_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {item.quiz?.topics.map((t, idx) => (
                                                    <span key={idx} className="topic-tag">{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`score-badge ${item.percentage >= 80 ? 'score-high' : item.percentage >= 50 ? 'score-med' : 'score-low'}`}>
                                                {item.percentage}%
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button 
                                                    className="btn-secondary" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    onClick={() => navigate(`/review/${item._id}`)}
                                                >
                                                    Review
                                                </button>
                                                <button 
                                                    className="btn-primary" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    onClick={() => navigate(`/plans/${item.quiz.study_plan}/quiz?topics=${encodeURIComponent(item.quiz.topics.join(','))}`)}
                                                >
                                                    Retake
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
