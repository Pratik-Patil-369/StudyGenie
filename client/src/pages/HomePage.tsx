import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiDelete } from '../utils/api';

interface StudyPlan {
    _id: string;
    title: string;
    syllabus: string;
    start_date: string;
    end_date: string;
    subject: string;
    current_grade: string;
    topics: { name: string; subtopics: string[]; completed: boolean }[];
    createdAt: string;
}

export default function HomePage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await apiGet('/study-plans');
            setPlans(data);
        } catch (err) {
            console.error('Failed to fetch plans');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this study plan?')) return;
        try {
            await apiDelete(`/study-plans/${id}`);
            setPlans(plans.filter((p) => p._id !== id));
        } catch (err) {
            console.error('Failed to delete');
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const totalTopics = plans.reduce((sum, p) => sum + (p.topics?.length || 0), 0);
    const completedTopics = plans.reduce(
        (sum, p) => sum + (p.topics?.filter(t => t.completed)?.length || 0), 0
    );

    return (
        <div className="home-page">
            <div className="home-header">
                <h1>Welcome back, <span>{user?.full_name || user?.email}</span>!</h1>
                <Link to="/new-plan" className="btn-primary">+ New Study Plan</Link>
            </div>

            {!loading && plans.length > 0 && (
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-label">Study Plans</div>
                        <div className="stat-value">{plans.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Topics</div>
                        <div className="stat-value blue">{totalTopics}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Completed</div>
                        <div className="stat-value green">{completedTopics}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Subjects</div>
                        <div className="stat-value amber">{new Set(plans.map(p => p.subject)).size}</div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading your study plans...</div>
            ) : plans.length === 0 ? (
                <div className="empty-state">
                    <h2>No study plans yet</h2>
                    <p>Create your first study plan to get started!</p>
                    <Link to="/new-plan" className="btn-primary">+ Create Study Plan</Link>
                </div>
            ) : (
                <div className="plans-grid">
                    {plans.map((plan) => (
                        <div className="plan-card" key={plan._id}>
                            <div className="plan-card-header">
                                <h3>{plan.title}</h3>
                                <span className="plan-subject">{plan.subject}</span>
                            </div>
                            <div className="plan-card-body">
                                <div className="plan-detail">
                                    <span className="label">Grade:</span>
                                    <span>{plan.current_grade}</span>
                                </div>
                                <div className="plan-detail">
                                    <span className="label">Duration:</span>
                                    <span>{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</span>
                                </div>
                                {plan.topics && plan.topics.length > 0 && (
                                    <div className="plan-topics-badge">
                                        {plan.topics.length} topic{plan.topics.length > 1 ? 's' : ''} extracted
                                    </div>
                                )}
                                <p className="syllabus-preview">
                                    {plan.syllabus.slice(0, 100)}{plan.syllabus.length > 100 ? '...' : ''}
                                </p>
                            </div>
                            <div className="plan-card-footer">
                                <Link to={`/plans/${plan._id}/topics`} className="btn-secondary">
                                    View Topics
                                </Link>
                                <button className="btn-danger" onClick={() => handleDelete(plan._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
