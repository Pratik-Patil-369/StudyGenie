import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuizResult {
    _id: string
    percentage: number
    quiz: { difficulty: string; topics: string[] }
    completed_at: string
}

interface StudyPlan {
    _id: string
    title: string
    topics: { name: string; completed: boolean }[]
}

interface Props {
    quizHistory: QuizResult[]
    plans: StudyPlan[]
}

const COLORS = ['#2dd4bf', '#334155', '#f59e0b', '#a855f7']

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
        }))

    // --- Topics Completion Pie Data ---
    const totalTopics = plans.reduce((s, p) => s + p.topics.length, 0)
    const completedTopics = plans.reduce((s, p) => s + p.topics.filter(t => t.completed).length, 0)
    const pieData = [
        { name: 'Completed', value: completedTopics },
        { name: 'Remaining', value: Math.max(0, totalTopics - completedTopics) }
    ]

    // --- Difficulty Breakdown Bar Data ---
    const diffCount = quizHistory.reduce((acc, r) => {
        const d = r.quiz?.difficulty || 'medium'
        acc[d] = (acc[d] || 0) + 1
        return acc
    }, {} as Record<string, number>)
    const diffData = [
        { name: 'Easy', quizzes: diffCount['easy'] || 0 },
        { name: 'Medium', quizzes: diffCount['medium'] || 0 },
        { name: 'Hard', quizzes: diffCount['hard'] || 0 },
    ]

    if (quizHistory.length === 0 && totalTopics === 0) return null

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover/95 backdrop-blur-sm border border-border shadow-md rounded-lg p-2 text-xs">
                    <p className="text-muted-foreground mb-1">{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} className="font-bold flex items-center gap-2" style={{ color: p.color || '#2dd4bf' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#2dd4bf' }} />
                            {p.name}: {p.value}{p.name === 'Score' ? '%' : ''}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold tracking-tight">Progress Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quiz Score Trend */}
                {scoreTrend.length > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Quiz Score Trend</CardTitle>
                            <p className="text-xs text-muted-foreground">Last {scoreTrend.length} quiz attempts</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                                        <XAxis dataKey="attempt" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            name="Score"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Topics Completion Pie */}
                {totalTopics > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Syllabus Progress</CardTitle>
                            <p className="text-xs text-muted-foreground">{completedTopics} of {totalTopics} topics done</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(val) => <span className="text-[10px] text-muted-foreground font-medium">{val}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Difficulty Breakdown */}
                {quizHistory.length > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Quiz Difficulty Breakdown</CardTitle>
                            <p className="text-xs text-muted-foreground">Volume by difficulty level</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={diffData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="quizzes" name="Quizzes" radius={[4, 4, 0, 0]}>
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
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
