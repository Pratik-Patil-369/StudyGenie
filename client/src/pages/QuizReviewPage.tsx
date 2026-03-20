import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../utils/api'
import { usePageTitle } from '../hooks/usePageTitle'
import { Bot, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface QuizReviewData {
    _id: string
    quiz: {
        _id: string
        difficulty: string
        topics: string[]
        study_plan: string
        questions: {
            question: string
            options: string[]
            answer: string
            explanation: string
        }[]
    }
    score: number
    total_questions: number
    percentage: number
    completed_at: string
    answers: {
        question_index: number
        selected_option: string
        is_correct: boolean
    }[]
}

export default function QuizReviewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [result, setResult] = useState<QuizReviewData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [aiExplanations, setAiExplanations] = useState<{ [key: number]: string }>({})
    const [explainingId, setExplainingId] = useState<number | null>(null)

    usePageTitle('Quiz Review')

    useEffect(() => {
        fetchResult()
    }, [id])

    const fetchResult = async () => {
        try {
            setLoading(true)
            const data = await apiGet(`/quizzes/result/${id}`)
            setResult(data)
        } catch (err) {
            setError('Failed to load quiz result.')
        } finally {
            setLoading(false)
        }
    }

    const handleExplain = async (questionIdx: number) => {
        if (!result) return
        setExplainingId(questionIdx)
        const q = result.quiz.questions[questionIdx]
        const userAnsObj = result.answers.find(a => a.question_index === questionIdx)
        try {
            const data = await apiPost('/quizzes/explain', {
                question: q.question, options: q.options, correctAnswer: q.answer,
                userAnswer: userAnsObj?.selected_option || 'None',
                topic: result.quiz.topics?.[0] || 'General'
            })
            setAiExplanations(prev => ({ ...prev, [questionIdx]: data.explanation }))
        } catch (err) {
            console.error('Explanation Error:', err)
        } finally {
            setExplainingId(null)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading quiz history...</p>
        </div>
    )

    if (error || !result) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center animate-fade-in">
            <h2 className="text-xl font-bold">Not Found</h2>
            <p className="text-muted-foreground">{error || 'Could not find this quiz.'}</p>
            <Button onClick={() => navigate('/profile')} className="mt-4">Back to Profile</Button>
        </div>
    )

    const difficultyColor = { easy: 'mastered' as const, medium: 'revision' as const, hard: 'weak' as const }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Historical Quiz Review</h1>
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/profile')}>← Back to Profile</Button>
                </div>
                <Badge variant={difficultyColor[result.quiz.difficulty as keyof typeof difficultyColor] || 'default'}>{result.quiz.difficulty} Mode</Badge>
            </div>

            {/* Score Card */}
            <Card className="text-center">
                <CardContent className="py-10">
                    <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-6xl font-extrabold text-primary">{result.score}</span>
                        <span className="text-2xl text-muted-foreground">/ {result.total_questions}</span>
                    </div>
                    <h2 className="text-xl font-semibold">Score: {result.percentage}%</h2>
                    <p className="text-sm text-muted-foreground mt-1">Taken on {new Date(result.completed_at || '').toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {result.quiz.topics.map((t, idx) => (
                            <Badge key={idx} variant="secondary">{t}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Review */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review Questions</h3>
                {result.quiz.questions.map((q, idx) => {
                    const userAns = result.answers.find(a => a.question_index === idx)
                    if (!userAns) return null

                    return (
                        <Card key={idx} className={cn('border-l-4', userAns.is_correct ? 'border-l-mastered' : 'border-l-weak')}>
                            <CardContent className="p-5 space-y-3">
                                <p className="font-medium">{idx + 1}. {q.question}</p>
                                <div className="text-sm space-y-1">
                                    <p>Your Answer: <span className={cn('font-semibold', userAns.is_correct ? 'text-mastered' : 'text-weak')}>{userAns.selected_option || 'None'}</span></p>
                                    {!userAns.is_correct && <p>Correct Answer: <span className="font-semibold text-mastered">{q.answer}</span></p>}
                                </div>
                                {q.explanation && <p className="text-sm text-muted-foreground"><strong>Tip:</strong> {q.explanation}</p>}

                                {!userAns.is_correct && (
                                    <div className="pt-2">
                                        {aiExplanations[idx] ? (
                                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                                                <p className="flex items-center gap-1.5 text-sm font-semibold mb-2"><Bot className="h-4 w-4" /> AI Tutor says:</p>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiExplanations[idx]}</p>
                                            </div>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => handleExplain(idx)} disabled={explainingId === idx}>
                                                {explainingId === idx ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Thinking...</> : <><Bot className="h-3 w-3 mr-1" /> Explain This</>}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => navigate('/profile')}>Return to Profile</Button>
                <Button onClick={() => navigate(`/plans/${result.quiz.study_plan}/quiz?topics=${encodeURIComponent(result.quiz.topics.join(','))}`)}>
                    Retake This Quiz
                </Button>
            </div>
        </div>
    )
}
