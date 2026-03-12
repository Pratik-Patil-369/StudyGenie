import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { toast } from '../components/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDateShort } from '../utils/dateFormat';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { generateICSFile } from '../utils/calendarExport';

interface DailyTask {
    day: number;
    date: string;
    topics: string[];
    duration_hours: number;
    difficulty: 'easy' | 'medium' | 'hard';
    notes: string;
}

interface PlanTopic {
    name: string;
    completed: boolean;
}

export default function DailyPlanPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [planTopics, setPlanTopics] = useState<PlanTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [quizLoadingDay, setQuizLoadingDay] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [providerInfo, setProviderInfo] = useState('');
    usePageTitle('Daily Plan');

    useEffect(() => {
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        try {
            const [planData, topicsData] = await Promise.all([
                apiGet(`/study-plans/${id}/daily-plan`),
                apiGet(`/study-plans/${id}/topics`)
            ]);
            setTasks(planData.daily_plan || []);
            setPlanTopics(topicsData.topics || []);
        } catch (err) {
            console.error('Failed to fetch daily plan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const handleExportCalendar = () => {
        if (tasks.length === 0) return;

        const events = tasks.map(task => {
            const startDate = new Date(task.date);
            startDate.setHours(9, 0, 0, 0); // Default study start time 9am

            return {
                title: `Study: Day ${task.day}`,
                description: `Topics:\n- ${task.topics.join('\n- ')}\n\nTips: ${task.notes || 'None'}`,
                startDate: startDate,
                durationMinutes: task.duration_hours * 60
            };
        });

        const planName = planTopics.length > 0 ? 'StudyGenie_Plan' : 'StudyGenie_Plan';
        generateICSFile(events, planName);
        toast('Calendar file downloaded!', 'success');
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

    const handleSendEmail = async () => {
        setSendingEmail(true);
        try {
            await apiPost('/notifications/daily-reminder', { planId: id });
            toast('📧 Today\'s study plan sent to your email!', 'success');
        } catch (err: any) {
            toast(err.message || 'Failed to send email. Check server EMAIL config.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDayQuiz = async (task: DailyTask) => {
        if (task.topics.length === 0) {
            toast('No topics found for this day.', 'error');
            return;
        }
        setQuizLoadingDay(task.day);
        try {
            const data = await apiPost(`/quizzes/${id}/generate-quiz`, { topics: task.topics });
            sessionStorage.setItem(`quiz_${id}`, JSON.stringify({
                quizId: data.quizId,
                questions: data.questions,
                difficulty: data.difficulty,
                dayLabel: `Day ${task.day} Quiz`
            }));
            navigate(`/plans/${id}/quiz?day=${task.day}`);
        } catch (err: any) {
            toast(err.message || 'Failed to generate day quiz.', 'error');
        } finally {
            setQuizLoadingDay(null);
        }
    };

    if (loading) return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">Loading study plan...</p>
        </div>
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper: check completion status of a day's topics
    const getDayCompletion = (dayTopics: string[]) => {
        if (dayTopics.length === 0) return { done: 0, total: 0, allDone: false };
        const completedSet = new Set(planTopics.filter(t => t.completed).map(t => t.name.toLowerCase()));
        const done = dayTopics.filter(t => completedSet.has(t.toLowerCase())).length;
        return { done, total: dayTopics.length, allDone: done === dayTopics.length };
    };

    return (
        <div className="daily-plan-page">
            <div className="page-header">
                <div>
                    <h1>Daily Study Schedule</h1>
                    <p className="subtitle">AI-generated personalized roadmap for your goals</p>
                </div>
                <div className="header-actions">
                    <Link to="/" className="btn-secondary">⬅ Dashboard</Link>
                    <Link to={`/plans/${id}/quiz`} className="btn-secondary">Take Adaptive Quiz</Link>
                    <Link to={`/plans/${id}/topics`} className="btn-secondary">View Topics</Link>
                    <button
                        onClick={handleExportCalendar}
                        className="btn-secondary"
                        disabled={tasks.length === 0}
                        title="Download .ics file for your calendar"
                    >
                        📅 Add to Calendar
                    </button>
                    <button
                        onClick={handleSendEmail}
                        className="btn-secondary"
                        disabled={sendingEmail || tasks.length === 0}
                        title="Send today's topics to your email"
                    >
                        {sendingEmail ? 'Sending...' : '📧 Email Today'}
                    </button>
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
                <div className="daily-plan-layout">
                    <div className="schedule-container">
                        {tasks.map((task) => {
                            const taskDate = new Date(task.date);
                            taskDate.setHours(0, 0, 0, 0);
                            const isToday = taskDate.getTime() === today.getTime();
                            const isPast = taskDate < today;
                            const { done, total, allDone } = getDayCompletion(task.topics);

                            return (
                                <div
                                    className={`day-card${isToday ? ' day-card-today' : ''}${isPast ? ' day-card-past' : ''}${allDone ? ' day-card-done' : ''}`}
                                    key={task.day}
                                >
                                    <div className="day-card-header">
                                        <div className="day-number">Day {task.day}</div>
                                        <div className="day-date">{formatDateShort(task.date)}</div>
                                        {isToday && <span className="today-badge">TODAY</span>}
                                        {allDone && <span className="done-badge">✓ DONE</span>}
                                        {total > 0 && (
                                            <div className="day-header-progress">
                                                <div className="day-header-progress-bar">
                                                    <div
                                                        className="day-progress-fill"
                                                        style={{ width: `${(done / total) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="day-progress-label">{done}/{total} done</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="day-card-body">
                                        <div className="task-topics">
                                            <strong>Topics:</strong>
                                            <ul>
                                                {task.topics.map((t, i) => {
                                                    const isDone = planTopics.find(
                                                        pt => pt.name.toLowerCase() === t.toLowerCase()
                                                    )?.completed;
                                                    return (
                                                        <li key={i} className={isDone ? 'topic-done' : ''}>
                                                            {isDone ? '✓ ' : ''}{t}
                                                        </li>
                                                    );
                                                })}
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
                                        <div className="day-quiz-action">
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleDayQuiz(task)}
                                                disabled={quizLoadingDay === task.day}
                                                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                                            >
                                                {quizLoadingDay === task.day ? 'Generating...' : '🧠 Quiz This Day'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pomodoro Timer Sidebar/Floating Widget */}
                    <div className="pomodoro-sidebar">
                        <PomodoroTimer />
                    </div>
                </div>
            )}
        </div>
    );
}
