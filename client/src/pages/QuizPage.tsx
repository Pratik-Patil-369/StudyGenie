import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { apiPost } from '../utils/api'
import { toast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import confetti from 'canvas-confetti'
import { Bot, Mail, AlertTriangle, Timer, Loader2, ArrowRight, RotateCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Question {
    question: string
    options: string[]
    answer: string
    explanation: string
}

interface QuizData {
    quizId: string
    questions: Question[]
    difficulty: string
    topics?: string[]
    dayLabel?: string
}

export default function QuizPage() {
    const { id: planId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const dayParam = searchParams.get('day')

    const [loading, setLoading] = useState(true)
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [answers, setAnswers] = useState<{ question_index: number; selected_option: string }[]>([])
    const [results, setResults] = useState<any>(null)
    const [error, setError] = useState('')
    const [aiExplanations, setAiExplanations] = useState<{ [key: number]: string }>({})
    const [explainingId, setExplainingId] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    const answersRef = useRef(answers)
    const currentStepRef = useRef(currentStep)
    const selectedOptionRef = useRef(selectedOption)

    useEffect(() => { answersRef.current = answers }, [answers])
    useEffect(() => { currentStepRef.current = currentStep }, [currentStep])
    useEffect(() => { selectedOptionRef.current = selectedOption }, [selectedOption])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const quizLabel = quiz?.dayLabel || (dayParam ? `Day ${dayParam} Quiz` : 'Adaptive Quiz')
    usePageTitle(results ? 'Quiz Results' : quizLabel)

    useEffect(() => {
        const cachedKey = `quiz_${planId}`
        const cached = sessionStorage.getItem(cachedKey)
        if (cached && dayParam) {
            try {
                const parsed = JSON.parse(cached)
                setQuiz(parsed)
                sessionStorage.removeItem(cachedKey)
                setLoading(false)
                return
            } catch { /* fall through */ }
        }
        generateQuiz()
    }, [planId])

    const generateQuiz = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await apiPost(`/quizzes/${planId}/generate-quiz`, {})
            setQuiz(data)
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz. Make sure you have completed topics!')
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (!selectedOption || !quiz) return
        const newAnswers = [...answers, { question_index: currentStep, selected_option: selectedOption }]
        setAnswers(newAnswers)
        if (currentStep < quiz.questions.length - 1) {
            setCurrentStep(currentStep + 1)
            setSelectedOption(null)
        } else {
            submitQuiz(newAnswers)
        }
    }

    const submitQuiz = async (finalAnswers: typeof answers) => {
        setLoading(true)
        try {
            const data = await apiPost(`/quizzes/submit-quiz/${quiz?.quizId}`, { answers: finalAnswers })
            setResults(data)
            if (data.percentage >= 80) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#2dd4bf', '#38bdf8', '#a855f7'] })
            }
            if (data.autoMarkedTopics && data.autoMarkedTopics.length > 0) {
                toast(`🎯 ${data.autoMarkedTopics.length} topic(s) auto-marked as done! (Score ≥ 80%)`, 'success')
            }
        } catch (err) {
            toast('Failed to submit results. Please try again.', 'error')
            setError('Failed to submit results')
        } finally {
            setLoading(false)
        }
    }

    const handleExplain = async (q: Question, idx: number, userAnsOptions: string) => {
        setExplainingId(idx)
        try {
            const data = await apiPost('/quizzes/explain', {
                question: q.question, options: q.options, correctAnswer: q.answer,
                userAnswer: userAnsOptions, topic: quiz?.topics ? quiz.topics[0] : 'General'
            })
            setAiExplanations(prev => ({ ...prev, [idx]: data.explanation }))
        } catch (err) {
            toast('Failed to get AI explanation', 'error')
        } finally {
            setExplainingId(null)
        }
    }

    const resetQuiz = () => {
        setResults(null)
        setCurrentStep(0)
        setSelectedOption(null)
        setAnswers([])
        setAiExplanations({})
        setExplainingId(null)
        setTimeLeft(null)
        generateQuiz()
    }

    const difficultyColor = {
        easy: 'mastered' as const,
        medium: 'revision' as const,
        hard: 'weak' as const,
    }

    // Loading state
    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">AI is crafting your quiz...</p>
        </div>
    )

    // Error state
    if (error) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center animate-fade-in">
            <AlertTriangle className="h-12 w-12 text-warning" />
            <h2 className="text-xl font-bold">Quiz Unavailable</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Button onClick={() => navigate(`/plans/${planId}/topics`)} className="mt-4">← Back to Topics</Button>
        </div>
    )

    // Results view
    if (results) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Quiz Results</h1>
                    <Badge variant={difficultyColor[quiz?.difficulty as keyof typeof difficultyColor] || 'default'}>{quiz?.difficulty} Mode</Badge>
                </div>

                {/* Score card */}
                <Card className="text-center">
                    <CardContent className="py-10">
                        <div className="inline-flex flex-col items-center">
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-6xl font-extrabold text-primary">{results.score}</span>
                                <span className="text-2xl text-muted-foreground">/ {results.total}</span>
                            </div>
                            <h2 className="text-xl font-semibold mb-1">
                                {results.percentage >= 80 ? 'Excellent Work!' : results.percentage >= 50 ? 'Good Progress!' : 'Keep Studying!'}
                            </h2>
                            <p className="text-muted-foreground">You scored {results.percentage}% on this {quizLabel.toLowerCase()}.</p>
                            {dayParam && (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                                    <Mail className="h-3.5 w-3.5" /> A results summary has been sent to your email.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Review Questions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Review Questions</h3>
                    {quiz?.questions.map((q, idx) => {
                        const userAns = results.review.find((r: any) => r.question_index === idx)
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
                                                <Button variant="outline" size="sm" onClick={() => handleExplain(q, idx, userAns.selected_option)} disabled={explainingId === idx}>
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
                    <Button variant="outline" onClick={() => navigate(`/plans/${planId}/topics`)}>Back to Topics</Button>
                    <Button variant="outline" onClick={() => navigate(`/plans/${planId}/daily-plan`)}>Daily Plan</Button>
                    <Button onClick={resetQuiz}><RotateCw className="h-4 w-4 mr-1" /> Try Another Quiz</Button>
                </div>
            </div>
        )
    }

    // Quiz in progress
    const currentQuestion = quiz?.questions[currentStep]
    const progressPct = ((currentStep + 1) / (quiz?.questions.length || 1)) * 100

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">{quizLabel}</h1>
                    <p className="text-sm text-muted-foreground">Question {currentStep + 1} of {quiz?.questions.length}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={difficultyColor[quiz?.difficulty as keyof typeof difficultyColor] || 'default'}>{quiz?.difficulty} Mode</Badge>
                    {timeLeft !== null && (
                        <div className={cn('flex items-center gap-1.5 text-sm font-semibold', timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground')}>
                            <Timer className="h-4 w-4" /> {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress dots + bar */}
            <div className="flex gap-1.5 justify-center flex-wrap">
                {quiz?.questions.map((_, idx) => (
                    <div key={idx} className={cn(
                        'h-2.5 w-2.5 rounded-full transition-all',
                        idx === currentStep ? 'bg-primary scale-125 shadow-[0_0_6px] shadow-primary/50' :
                            idx < currentStep ? 'bg-primary/50' : 'bg-border'
                    )} />
                ))}
            </div>
            <Progress value={progressPct} className="h-1.5" />

            {/* Question card */}
            <Card>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <h2 className="text-lg font-semibold leading-relaxed">{currentQuestion?.question}</h2>
                    <div className="grid gap-3">
                        {currentQuestion?.options.map((opt, idx) => (
                            <button
                                key={idx}
                                className={cn(
                                    'w-full text-left rounded-lg border-2 p-4 text-sm font-medium transition-all',
                                    selectedOption === opt
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                )}
                                onClick={() => setSelectedOption(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Next button */}
            <Button size="lg" className="w-full" disabled={!selectedOption} onClick={handleNext}>
                {currentStep === (quiz?.questions.length || 0) - 1 ? 'Finish Quiz' : <>Next Question <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
        </div>
    )
}
