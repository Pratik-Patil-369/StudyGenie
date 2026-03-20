import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGet, apiDelete } from '../utils/api'
import CountUp from 'react-countup'
import { BookOpen, Target, CheckCircle, TrendingUp, XCircle, Plus, Calendar, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface StudyPlan {
    _id: string
    title: string
    subject: string
    start_date: string
    end_date: string
    current_grade: string
    topics: { name: string; completed: boolean }[]
}

interface QuizResult {
    _id: string
    score: number
    percentage: number
    completed_at: string
    quiz: {
        title: string
        difficulty: string
        topics: string[]
    }
}

export default function HomePage() {
    const { user } = useAuth()
    const [plans, setPlans] = useState<StudyPlan[]>([])
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([])
    const [loading, setLoading] = useState(true)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [plansRes, historyRes] = await Promise.all([
                apiGet('/study-plans'),
                apiGet('/quizzes/quiz-history')
            ])
            setPlans(plansRes)
            setQuizHistory(historyRes)
        } catch (err) {
            console.error('Failed to fetch dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = useCallback(async (id: string) => {
        try {
            await apiDelete(`/study-plans/${id}`)
            setPlans(prev => prev.filter((p) => p._id !== id))
            setConfirmDeleteId(null)
        } catch (err) {
            console.error('Failed to delete')
        }
    }, [])

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    })

    const totalTopics = useMemo(
        () => plans.reduce((sum, p) => sum + (p.topics?.length || 0), 0),
        [plans]
    )

    const completedTopics = useMemo(
        () => plans.reduce((sum, p) => sum + (p.topics?.filter(t => t.completed)?.length || 0), 0),
        [plans]
    )

    const avgSuccessRate = useMemo(
        () => quizHistory.length > 0
            ? Math.round(quizHistory.reduce((s, r) => s + r.percentage, 0) / quizHistory.length)
            : 0,
        [quizHistory]
    )

    const stats = [
        { label: 'Active Plans', value: plans.length, icon: BookOpen, color: 'text-primary' },
        { label: 'Success Rate', value: avgSuccessRate, suffix: '%', icon: TrendingUp, color: 'text-emerald-500' },
        { label: 'Completed', value: completedTopics, icon: CheckCircle, color: 'text-mastered' },
        { label: 'Mastery', value: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0, suffix: '%', icon: Target, color: 'text-primary' },
    ]

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Welcome */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                            Welcome back, <span className="text-violet-200">{user?.full_name || user?.email.split('@')[0]}</span>!
                        </h1>
                        <p className="text-white/70">Ready to continue your learning journey today?</p>
                    </div>
                    <Button asChild className="bg-white text-violet-700 hover:bg-white/90 font-semibold">
                        <Link to="/new-plan">
                            <Plus className="h-4 w-4 mr-2" /> New Study Plan
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            {!loading && plans.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(({ label, value, suffix, icon: Icon, color }) => (
                        <Card key={label} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 md:p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={cn('h-4 w-4', color)} />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                                </div>
                                <div className={cn('text-2xl md:text-3xl font-bold', color)}>
                                    <CountUp end={value} suffix={suffix} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Study Plans */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Your Study Plans</h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <Card key={i}>
                                <CardContent className="p-6 space-y-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-2 w-full" />
                                    <div className="flex gap-3">
                                        <Skeleton className="h-10 flex-1" />
                                        <Skeleton className="h-10 flex-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                <GraduationCap className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No study plans yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Create your first study plan to get started on your learning journey!
                            </p>
                            <Button asChild>
                                <Link to="/new-plan">
                                    <Plus className="h-4 w-4 mr-2" /> Create Study Plan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plans.map((plan) => {
                            const pDone = plan.topics?.length > 0
                                ? Math.round((plan.topics.filter(t => t.completed).length / plan.topics.length) * 100)
                                : 0
                            return (
                                <Card key={plan._id} className="group hover:shadow-md transition-all">
                                    <CardContent className="p-6 flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold leading-tight">{plan.title}</h3>
                                                <Badge variant="outline" className="text-xs">{plan.subject}</Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setConfirmDeleteId(plan._id)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Completion</span>
                                                <span className="font-semibold text-primary">{pDone}%</span>
                                            </div>
                                            <Progress value={pDone} className="h-2" />
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Target</span>
                                                <span className="font-medium">Grade {plan.current_grade}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Timeline</span>
                                                <span className="font-medium flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-1">
                                            <Button variant="outline" className="flex-1" asChild>
                                                <Link to={`/plans/${plan._id}/topics`}>Roadmap</Link>
                                            </Button>
                                            <Button className="flex-1" asChild>
                                                <Link to={`/plans/${plan._id}/daily-plan`}>Daily Plan</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Study Plan?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this study plan? All associated tasks, quizzes, and progress will be permanently lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
                            Yes, Delete Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
