import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

interface QuizResult {
    _id: string;
    percentage: number;
    quiz: { difficulty: string; topics: string[] };
    completed_at: string;
}

interface StudyPlan {
    _id: string;
    title: string;
    topics: { name: string; completed: boolean }[];
}

interface Props {
    quizHistory: QuizResult[];
    plans: StudyPlan[];
}

const COLORS = ['#2dd4bf', '#334155', '#f59e0b', '#a855f7'];

export default function ProgressCharts({ quizHistory, plans }: Props) {
    // --- Quiz Score Trend Data ---
    const scoreTrend = [...quizHistory]
        .reverse()
        .slice(-10)
        .map((r, i) => ({
            attempt: `#${i + 1}`,
            score: Math.round(r.percentage),
            difficulty: r.quiz?.difficulty || 'medium',
            date: new Date(r.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        }));

    // --- Topics Completion Pie Data ---
    const totalTopics = plans.reduce((s, p) => s + p.topics.length, 0);
    const completedTopics = plans.reduce((s, p) => s + p.topics.filter(t => t.completed).length, 0);
    const pieData = [
        { name: 'Completed', value: completedTopics },
        { name: 'Remaining', value: Math.max(0, totalTopics - completedTopics) }
    ];

    // --- Difficulty Breakdown Bar Data ---
    const diffCount = quizHistory.reduce((acc, r) => {
        const d = r.quiz?.difficulty || 'medium';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const diffData = [
        { name: 'Easy', quizzes: diffCount['easy'] || 0 },
        { name: 'Medium', quizzes: diffCount['medium'] || 0 },
        { name: 'Hard', quizzes: diffCount['hard'] || 0 },
    ];

    if (quizHistory.length === 0 && totalTopics === 0) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(45,212,191,0.3)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    color: '#f8fafc'
                }}>
                    <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} style={{ color: p.color || '#2dd4bf', fontWeight: 700 }}>
                            {p.name}: {p.value}{p.name === 'Score' ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="progress-charts-section">
            <h2 className="section-title">Progress Analytics</h2>
            <div className="charts-grid">

                {/* Quiz Score Trend */}
                {scoreTrend.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Quiz Score Trend</h3>
                        <p className="chart-subtitle">Last {scoreTrend.length} quiz attempts</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={scoreTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="attempt" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    name="Score"
                                    stroke="#2dd4bf"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#2dd4bf', r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#2dd4bf', stroke: 'rgba(45,212,191,0.3)', strokeWidth: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Topics Completion Pie */}
                {totalTopics > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Syllabus Progress</h3>
                        <p className="chart-subtitle">{completedTopics} of {totalTopics} topics done</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(val) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{val}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Difficulty Breakdown */}
                {quizHistory.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Quiz Difficulty Breakdown</h3>
                        <p className="chart-subtitle">How many quizzes at each level</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={diffData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="quizzes" name="Quizzes" radius={[6, 6, 0, 0]}>
                                    {diffData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Easy' ? '#2dd4bf' : entry.name === 'Medium' ? '#f59e0b' : '#f87171'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

            </div>
        </div>
    );
}
