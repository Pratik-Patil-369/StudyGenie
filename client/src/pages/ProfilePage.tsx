import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGet } from '../utils/api'
import { Flame, Medal, Book, CheckCircle, Brain, Target, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface UserStats {
    totalPlans: number
    completedTopics: number
    totalTopics: number
    totalQuizzes: number
    avgScore: number
}

interface QuizResult {
    _id: string
    quiz: { _id: string; study_plan: string; topics: string[] }
    score: number
    total_questions: number
    percentage: number
    completed_at: string
}

export default function ProfilePage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<QuizResult[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchStats() }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            const [statsData, historyData] = await Promise.all([apiGet('/users/stats'), apiGet('/quizzes/quiz-history')])
            setStats(statsData)
            setHistory(historyData)
        } catch (error) {
            console.error('Failed to fetch user stats', error)
        } finally {
            setLoading(false)
        }
    }

    const completionRate = stats && stats.totalTopics > 0 ? Math.round((stats.completedTopics / stats.totalTopics) * 100) : 0

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <Card><CardContent className="p-6 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /></div>
            </CardContent></Card>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-12 w-12 rounded-lg mb-3" /><Skeleton className="h-6 w-16 mb-1" /><Skeleton className="h-4 w-24" /></CardContent></Card>)}
            </div>
        </div>
    )

    const statCards = [
        { label: 'Study Plans', value: stats?.totalPlans || 0, sub: 'Total Created', icon: Book, color: 'text-blue-400' },
        { label: 'Topics Done', value: `${stats?.completedTopics || 0} / ${stats?.totalTopics || 0}`, sub: `${completionRate}% Completion`, icon: CheckCircle, color: 'text-mastered' },
        { label: 'Quizzes Taken', value: stats?.totalQuizzes || 0, sub: 'Total Attempts', icon: Brain, color: 'text-violet-400' },
        { label: 'Avg Score', value: `${stats?.avgScore || 0}%`, sub: 'Across all quizzes', icon: Target, color: 'text-primary' },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Profile header */}
            <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 text-xl">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left flex-1">
                        <h1 className="text-xl font-bold">{user?.full_name || 'Student'}</h1>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="flex gap-2">
                        {user?.currentStreak !== undefined && user.currentStreak > 0 && (
                            <Badge variant="default" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                <Flame className="h-3.5 w-3.5 mr-1" /> {user.currentStreak} Day Streak
                            </Badge>
                        )}
                        <Badge variant="secondary"><Medal className="h-3.5 w-3.5 mr-1" /> {user?.xp || 0} XP</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, sub, icon: Icon, color }) => (
                    <Card key={label} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-3', color)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</h3>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quiz history */}
            <Card>
                <CardHeader><CardTitle>Recent Quizzes</CardTitle></CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <p className="text-muted-foreground py-4">You haven't taken any quizzes yet. Generate a study plan to get started!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Topic(s)</th>
                                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Score</th>
                                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(item => (
                                        <tr key={item._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 px-2 text-muted-foreground">{new Date(item.completed_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.quiz?.topics.map((t, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">{t}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={item.percentage >= 80 ? 'mastered' : item.percentage >= 50 ? 'revision' : 'weak'}>
                                                    {item.percentage}%
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => navigate(`/review/${item._id}`)}>Review</Button>
                                                    <Button size="sm" onClick={() => navigate(`/plans/${item.quiz.study_plan}/quiz?topics=${encodeURIComponent(item.quiz.topics.join(','))}`)}>Retake</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
