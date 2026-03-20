import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../utils/api'
import { toast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDateShort } from '../utils/dateFormat'
import { PomodoroTimer } from '../components/PomodoroTimer'
import { generateICSFile } from '../utils/calendarExport'
import { ChevronLeft, Brain, Calendar, BrainCircuit, RefreshCw, Check, CheckCircle, Printer, Layers, XCircle, Clock, Loader2 } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DailyTask {
    day: number
    date: string
    topics: string[]
    duration_hours: number
    difficulty: 'easy' | 'medium' | 'hard'
    notes: string
}

interface PlanTopic {
    name: string
    completed: boolean
}

export default function DailyPlanPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState<DailyTask[]>([])
    const [planTopics, setPlanTopics] = useState<PlanTopic[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [quizLoadingDay, setQuizLoadingDay] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [providerInfo, setProviderInfo] = useState('')
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    usePageTitle('Daily Plan')

    useEffect(() => {
        fetchAll()
    }, [id])

    const fetchAll = async () => {
        try {
            const [planData, topicsData] = await Promise.all([
                apiGet(`/study-plans/${id}/daily-plan`),
                apiGet(`/study-plans/${id}/topics`)
            ])
            setTasks(planData.daily_plan || [])
            setPlanTopics(topicsData.topics || [])
        } catch (err) {
            console.error('Failed to fetch daily plan')
        } finally {
            setLoading(false)
        }
    }

    const handleExportCalendar = () => {
        if (tasks.length === 0) return
        const events = tasks.map(task => {
            const startDate = new Date(task.date)
            startDate.setHours(9, 0, 0, 0)
            return {
                title: `Study: Day ${task.day}`,
                description: `Topics:\n- ${task.topics.join('\n- ')}\n\nTips: ${task.notes || 'None'}`,
                startDate,
                durationMinutes: task.duration_hours * 60
            }
        })
        generateICSFile(events, 'StudyGenie_Plan')
        toast('Calendar file downloaded!', 'success')
    }

    const handleGenerate = async () => {
        setGenerating(true)
        setError('')
        try {
            const data = await apiPost(`/study-plans/${id}/generate-plan`)
            setTasks(data.daily_plan)
            const providerName = data.provider === 'local' ? 'Local AI (Ollama)' :
                data.provider === 'groq' ? 'Groq AI (Fast Cloud)' : 'Google Gemini (Cloud)'
            setProviderInfo(`Plan generated using ${providerName}`)
            toast(`Plan generated using ${providerName}`)
        } catch (err: any) {
            setError(err.message || 'Failed to generate plan')
        } finally {
            setGenerating(false)
        }
    }

    const handleDayQuiz = async (task: DailyTask) => {
        if (task.topics.length === 0) {
            toast('No topics found for this day.', 'error')
            return
        }
        setQuizLoadingDay(task.day)
        try {
            const data = await apiPost(`/quizzes/${id}/generate-quiz`, { topics: task.topics })
            sessionStorage.setItem(`quiz_${id}`, JSON.stringify({
                quizId: data.quizId,
                questions: data.questions,
                difficulty: data.difficulty,
                dayLabel: `Day ${task.day} Quiz`
            }))
            navigate(`/plans/${id}/quiz?day=${task.day}`)
        } catch (err: any) {
            toast(err.message || 'Failed to generate day quiz.', 'error')
        } finally {
            setQuizLoadingDay(null)
        }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDayCompletion = (dayTopics: string[]) => {
        if (dayTopics.length === 0) return { done: 0, total: 0, allDone: false }
        const completedSet = new Set(planTopics.filter(t => t.completed).map(t => t.name.toLowerCase()))
        const done = dayTopics.filter(t => completedSet.has(t.toLowerCase())).length
        return { done, total: dayTopics.length, allDone: done === dayTopics.length }
    }

    const difficultyStyles = {
        easy: 'bg-mastered/10 text-mastered border-mastered/20',
        medium: 'bg-revision/10 text-revision border-revision/20',
        hard: 'bg-weak/10 text-weak border-weak/20',
    }

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <Breadcrumb planTitle="Daily Plan" />
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2"><Skeleton className="h-8 w-72" /><Skeleton className="h-4 w-96" /></div>
                <div className="flex gap-2"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-32" /></div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Card key={i}><CardContent className="p-6 space-y-4">
                        <div className="flex justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-6 w-24" /></div>
                        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" />
                    </CardContent></Card>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <Breadcrumb planTitle="Daily Plan" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Daily Study Schedule</h1>
                    <p className="text-muted-foreground mt-1">AI-generated personalized roadmap for your goals</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => tasks.length > 0 ? setShowRegenerateConfirm(true) : handleGenerate()} disabled={generating}>
                        <RefreshCw className={cn('h-4 w-4 mr-1', generating && 'animate-spin')} /> {generating ? 'Generating...' : 'Generate'}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/plans/${id}/flashcards`}><Layers className="h-4 w-4 mr-1" /> Flashcards</Link>
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/plans/${id}/quiz`)} disabled={tasks.length === 0}>
                        <Brain className="h-4 w-4 mr-1" /> Take Quiz
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">More</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link to={`/plans/${id}/topics`}><BrainCircuit className="h-4 w-4 mr-2" /> View All Topics</Link></DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportCalendar} disabled={tasks.length === 0}><Calendar className="h-4 w-4 mr-2" /> Add to Calendar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive"><XCircle className="h-4 w-4 mr-2" /> Delete Plan</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Status messages */}
            {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {providerInfo && <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">{providerInfo}</div>}

            {/* Content */}
            {tasks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No daily schedule yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">Click Generate to have AI create a day-by-day study roadmap for you.</p>
                        {generating && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                                <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking... this may take a few seconds.
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex gap-6">
                    <div className="flex-1 space-y-4">
                        {tasks.map((task) => {
                            const taskDate = new Date(task.date)
                            taskDate.setHours(0, 0, 0, 0)
                            const isToday = taskDate.getTime() === today.getTime()
                            const isPast = taskDate < today
                            const { done, total, allDone } = getDayCompletion(task.topics)

                            return (
                                <Card key={task.day} className={cn(
                                    'transition-all',
                                    isToday && 'ring-2 ring-primary shadow-md',
                                    allDone && 'bg-mastered/5 border-mastered/20',
                                    isPast && !allDone && 'opacity-70'
                                )}>
                                    <CardContent className="p-5 space-y-4">
                                        {/* Day header */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-lg font-bold">Day {task.day}</span>
                                            <span className="text-sm text-muted-foreground">{formatDateShort(task.date)}</span>
                                            {isToday && <Badge variant="default" className="text-xs">TODAY</Badge>}
                                            {allDone && <Badge variant="mastered" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Done</Badge>}
                                            {total > 0 && (
                                                <div className="ml-auto flex items-center gap-2 text-sm">
                                                    <Progress value={(done / total) * 100} className="w-20 h-1.5" />
                                                    <span className="text-xs text-muted-foreground">{done}/{total}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Topics */}
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topics</span>
                                            <ul className="space-y-1">
                                                {task.topics.map((t, i) => {
                                                    const isDone = planTopics.find(pt => pt.name.toLowerCase() === t.toLowerCase())?.completed
                                                    return (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            {isDone ? <Check className="h-4 w-4 text-mastered shrink-0 mt-0.5" /> : <div className="h-4 w-4 shrink-0" />}
                                                            <span className={cn(isDone && 'line-through text-muted-foreground')}>{t}</span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>

                                        {/* Meta + Actions */}
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" /> {task.duration_hours} hrs
                                            </div>
                                            <Badge variant="outline" className={cn('text-xs capitalize', difficultyStyles[task.difficulty])}>
                                                {task.difficulty}
                                            </Badge>
                                            <Button variant="outline" size="sm" className="ml-auto text-xs" onClick={() => handleDayQuiz(task)} disabled={quizLoadingDay === task.day}>
                                                {quizLoadingDay === task.day ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</> : <><Brain className="h-3 w-3 mr-1" /> Quiz This Day</>}
                                            </Button>
                                        </div>

                                        {/* Notes */}
                                        {task.notes && (
                                            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                                                <strong className="text-foreground">Study Tips:</strong> {task.notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pomodoro Timer */}
                    <div className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-20">
                            <PomodoroTimer />
                        </div>
                    </div>
                </div>
            )}

            {/* Regenerate Confirmation */}
            <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Plan?</DialogTitle>
                        <DialogDescription>This will permanently replace your current daily plan with a new AI-generated plan. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateConfirm(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { setShowRegenerateConfirm(false); handleGenerate() }}>Yes, Regenerate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Study Plan?</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this study plan? All generated daily roadmaps and progress will be lost. This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={async () => {
                            try {
                                await apiPost(`/study-plans/${id}/delete`, {})
                                toast('Study plan deleted')
                                navigate('/')
                            } catch (err: any) {
                                toast(err.message || 'Failed to delete plan', 'error')
                            }
                        }}>Permanently Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
