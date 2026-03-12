import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiDelete } from '../utils/api';
import ProgressCharts from '../components/ProgressCharts';
import { Leaderboard } from '../components/Leaderboard';

interface StudyPlan {
    _id: string;
    title: string;
    subject: string;
    start_date: string;
    end_date: string;
    current_grade: string;
    topics: { name: string; completed: boolean }[];
}

interface QuizResult {
    _id: string;
    score: number;
    percentage: number;
    completed_at: string;
    quiz: {
        title: string;
        difficulty: string;
        topics: string[];
    };
}

export default function HomePage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [plansRes, historyRes] = await Promise.all([
                apiGet('/study-plans'),
                apiGet('/quizzes/quiz-history')
            ]);
            setPlans(plansRes);
            setQuizHistory(historyRes);
        } catch (err) {
            console.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = useCallback(async (id: string) => {
        try {
            await apiDelete(`/study-plans/${id}`);
            setPlans(prev => prev.filter((p) => p._id !== id));
            setConfirmDeleteId(null);
        } catch (err) {
            console.error('Failed to delete');
        }
    }, []);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const totalTopics = useMemo(
        () => plans.reduce((sum, p) => sum + (p.topics?.length || 0), 0),
        [plans]
    );

    const completedTopics = useMemo(
        () => plans.reduce((sum, p) => sum + (p.topics?.filter(t => t.completed)?.length || 0), 0),
        [plans]
    );

    const avgSuccessRate = useMemo(
        () => quizHistory.length > 0
            ? Math.round(quizHistory.reduce((s, r) => s + r.percentage, 0) / quizHistory.length)
            : 0,
        [quizHistory]
    );

    return (
        <div className="home-page">
            <div className="home-header">
                <div>
                    <h1>Welcome back, <span>{user?.full_name || user?.email.split('@')[0]}</span>!</h1>
                    <p className="subtitle">Track your progress and test your knowledge</p>
                </div>
                <Link to="/new-plan" className="btn-primary">+ New Study Plan</Link>
            </div>

            {!loading && plans.length > 0 && (
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-label">Active Plans</div>
                        <div className="stat-value">{plans.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Success Rate</div>
                        <div className="stat-value blue">{avgSuccessRate}%</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Completed</div>
                        <div className="stat-value green">{completedTopics}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Syllabus Mastered</div>
                        <div className="stat-value amber">
                            {totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0}%
                        </div>
                    </div>
                </div>
            )}

            <div className="main-dashboard-grid">
                <div className="plans-section">
                    <h2>Your Study Plans</h2>
                    {loading ? (
                        <div className="skeleton-list">
                            {[1, 2].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="empty-state">
                            <h2>No study plans yet</h2>
                            <p>Create your first study plan to get started!</p>
                            <Link to="/new-plan" className="btn-primary">+ Create Study Plan</Link>
                        </div>
                    ) : (
                        <div className="plans-grid">
                            {plans.map((plan) => {
                                const pDone = plan.topics?.length > 0
                                    ? Math.round((plan.topics.filter(t => t.completed).length / plan.topics.length) * 100)
                                    : 0;
                                return (
                                    <div className="plan-card" key={plan._id}>
                                        <div className="plan-card-header">
                                            <h3>{plan.title}</h3>
                                            <span className="plan-subject">{plan.subject}</span>
                                        </div>
                                        <div className="plan-card-body">
                                            <div className="plan-progress-info">
                                                <div className="prog-label">Completion: {pDone}%</div>
                                                <div className="prog-bar-mini">
                                                    <div className="prog-fill" style={{ width: `${pDone}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="plan-detail">
                                                <span className="label">Grade Target:</span>
                                                <span className="value">{plan.current_grade}</span>
                                            </div>
                                            <div className="plan-detail">
                                                <span className="label">Timeline:</span>
                                                <span className="value">{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</span>
                                            </div>
                                        </div>
                                        <div className="plan-card-footer">
                                            <Link to={`/plans/${plan._id}/topics`} className="btn-secondary">View Roadmap</Link>
                                            <Link to={`/plans/${plan._id}/daily-plan`} className="btn-primary">Daily Plan</Link>
                                            {confirmDeleteId === plan._id ? (
                                                <div className="delete-confirm">
                                                    <span>Sure?</span>
                                                    <button className="btn-remove" onClick={() => handleDelete(plan._id)}>Yes</button>
                                                    <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => setConfirmDeleteId(null)}>No</button>
                                                </div>
                                            ) : (
                                                <button className="btn-remove" onClick={() => setConfirmDeleteId(plan._id)}>Delete</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column Layout Container */}
                <div className="dashboard-sidebar">
                    {!loading && quizHistory.length > 0 && (
                        <div className="history-section">
                            <h2>Recent Performance</h2>
                            <div className="history-list">
                                {quizHistory.map((res) => (
                                    <div className="history-item glass-card" key={res._id}>
                                        <div className="hist-header">
                                            <span className="hist-score">{res.percentage}%</span>
                                            <div className={`difficulty-badge difficulty-${res.quiz?.difficulty || 'medium'}`}>
                                                {res.quiz?.difficulty || 'med'}
                                            </div>
                                        </div>
                                        <p className="hist-topics">{res.quiz?.topics?.slice(0, 2).join(', ')}...</p>
                                        <span className="hist-date">{new Date(res.completed_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && (
                        <div className="leaderboard-section">
                            <Leaderboard />
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Analytics Charts */}
            {!loading && (quizHistory.length > 0 || plans.some(p => p.topics?.length > 0)) && (
                <ProgressCharts quizHistory={quizHistory} plans={plans} />
            )}
        </div>
    );
}
