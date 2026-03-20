import { useEffect, useState } from 'react'
import { apiGet } from '../utils/api'
import ProgressCharts from '../components/ProgressCharts'
import { Loader2, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsPage() {
    const [plans, setPlans] = useState([])
    const [quizHistory, setQuizHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [plansRes, historyRes] = await Promise.all([
                apiGet('/study-plans'),
                apiGet('/quizzes/quiz-history')
            ])
            setPlans(plansRes)
            setQuizHistory(historyRes)
        } catch (err) {
            console.error('Failed to fetch analytics data')
        } finally {
            setLoading(false)
        }
    }

    const difficultyColor: Record<string, string> = {
        easy: 'bg-mastered/10 text-mastered',
        medium: 'bg-revision/10 text-revision',
        hard: 'bg-weak/10 text-weak',
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground mt-1">Detailed breakdown of your study progress and quiz performance</p>
            </div>

            {quizHistory.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Recent Performance</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quizHistory.slice(0, 4).map((res: any) => (
                            <Card key={res._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-extrabold text-primary">{res.percentage}%</span>
                                        <Badge className={difficultyColor[res.quiz?.difficulty || 'medium']}>{res.quiz?.difficulty || 'med'}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {res.quiz?.topics?.slice(0, 2).join(', ')} {res.quiz?.topics?.length > 2 ? '...' : ''}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(res.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {(quizHistory.length > 0 || plans.some((p: any) => p.topics?.length > 0)) ? (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Progress Charts</h2>
                    <ProgressCharts quizHistory={quizHistory} plans={plans} />
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Not enough data</h3>
                        <p className="text-muted-foreground max-w-sm">Complete some topics and take quizzes to unlock your analytics.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
