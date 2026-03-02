import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { toast } from '../components/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDateShort } from '../utils/dateFormat';

interface DailyTask {
    day: number;
    date: string;
    topics: string[];
    duration_hours: number;
    difficulty: 'easy' | 'medium' | 'hard';
    notes: string;
}

export default function DailyPlanPage() {
    const { id } = useParams<{ id: string }>();
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [providerInfo, setProviderInfo] = useState('');
    usePageTitle('Daily Plan');

    useEffect(() => {
        fetchDailyPlan();
    }, [id]);

    const fetchDailyPlan = async () => {
        try {
            const data = await apiGet(`/study-plans/${id}/daily-plan`);
            setTasks(data.daily_plan || []);
        } catch (err) {
            console.error('Failed to fetch daily plan');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const data = await apiPost(`/study-plans/${id}/generate-plan`);
            setTasks(data.daily_plan);
            const providerName = data.provider === 'local' ? 'Local AI (Ollama)' :
                data.provider === 'groq' ? 'Groq AI (Fast Cloud)' :
                    'Google Gemini (Cloud)';
            const msg = `Plan generated using ${providerName}`;
            setProviderInfo(msg);
            toast(msg);
        } catch (err: any) {
            setError(err.message || 'Failed to generate plan');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">Loading study plan...</p>
        </div>
    );

    return (
        <div className="daily-plan-page">
            <div className="page-header">
                <div>
                    <h1>Daily Study Schedule</h1>
                    <p className="subtitle">AI-generated personalized roadmap for your goals</p>
                </div>
                <div className="header-actions">
                    <Link to={`/plans/${id}/quiz`} className="btn-secondary">Take Adaptive Quiz</Link>
                    <Link to={`/plans/${id}/topics`} className="btn-secondary">View Topics</Link>
                    <button
                        onClick={handleGenerate}
                        className="btn-primary"
                        disabled={generating}
                    >
                        {generating ? 'Generating (AI)...' : tasks.length > 0 ? 'Regenerate Plan' : 'Generate with AI'}
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {providerInfo && <div className="info-banner">{providerInfo}</div>}

            {tasks.length === 0 ? (
                <div className="empty-state">
                    <h2>No daily schedule yet</h2>
                    <p>Click the button above to have AI create a day-by-day study roadmap for you.</p>
                    {generating && <div className="ai-loader">AI is thinking... this may take a few seconds.</div>}
                </div>
            ) : (
                <div className="schedule-container">
                    {tasks.map((task) => (
                        <div className="day-card" key={task.day}>
                            <div className="day-card-header">
                                <div className="day-number">Day {task.day}</div>
                                <div className="day-date">{formatDateShort(task.date)}</div>
                            </div>
                            <div className="day-card-body">
                                <div className="task-topics">
                                    <strong>Topics:</strong>
                                    <ul>
                                        {task.topics.map((t, i) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>
                                <div className="task-meta">
                                    <div className="meta-item">
                                        <span className="label">Duration</span>
                                        <span className="value">{task.duration_hours} hrs</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">Difficulty</span>
                                        <div className={`difficulty-badge difficulty-${task.difficulty}`}>
                                            {task.difficulty}
                                        </div>
                                    </div>
                                </div>
                                {task.notes && (
                                    <div className="task-notes">
                                        <strong>Study Tips:</strong>
                                        <p>{task.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
