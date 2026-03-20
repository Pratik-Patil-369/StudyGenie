import { Link, Navigate } from 'react-router-dom'
import { GraduationCap, FileText, Sparkles, Target, ArrowRight, Zap, Trophy, ChevronRight, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const features = [
    {
        icon: FileText,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        title: 'Smart Extractor',
        desc: 'Our AI analyzes any course syllabus or PDF to instantly identify key topics and learning objectives.',
    },
    {
        icon: Zap,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        title: 'Daily Roadmaps',
        desc: 'Get a perfectly paced, day-by-day breakdown of exactly what you need to study to hit your deadline.',
    },
    {
        icon: Target,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        title: 'Adaptive Quizzes',
        desc: 'Stop guessing. Our AI generates dynamic quizzes that adapt to your skill level, ensuring concept mastery.',
    },
    {
        icon: Trophy,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        title: 'Gamified Progress',
        desc: 'Stay motivated with streaks, XP, global leaderboards, and beautiful progress analytics.',
    },
]

const steps = [
    { num: '1', title: 'Upload Your Syllabus', desc: 'Drag and drop your course PDF. Set your exam date and target grade.' },
    { num: '2', title: 'AI Generates Plan', desc: 'StudyGenie instantly creates a structured, daily study schedule for you.' },
    { num: '3', title: 'Study & Test', desc: 'Follow your daily plan, take AI quizzes, and track your mastery.' },
]

export default function LandingPage() {
    const { setTheme, isDark } = useTheme()
    const { user } = useAuth()

    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2.5 text-foreground">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                            <GraduationCap className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">StudyGenie</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="rounded-full"
                            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                        >
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" asChild className="hidden sm:inline-flex">
                            <Link to="/login">Log in</Link>
                        </Button>
                        <Button asChild className="shadow-lg shadow-primary/20">
                            <Link to="/login">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />

                <div className="relative mx-auto max-w-4xl text-center px-4 sm:px-6">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>The #1 AI Study Companion</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                        Transform your syllabus into a{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                            mastery roadmap
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
                        Upload your course PDF and let our AI generate a personalized, day-by-day study plan with adaptive quizzes to guarantee your success.
                    </p>

                    <Button size="lg" asChild className="text-base px-8 py-6">
                        <Link to="/login">
                            Start Learning for Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 sm:py-28 px-4 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            Everything you need to ace your exams
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Powerful features designed to optimize your learning process.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ icon: Icon, color, bg, title, desc }) => (
                            <Card key={title} className="group hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${bg} mb-4`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 sm:py-28 bg-muted/30 px-4 sm:px-6">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How StudyGenie Works</h2>
                        <p className="text-muted-foreground text-lg">Three simple steps from syllabus to success.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-4">
                        {steps.map((step, i) => (
                            <div key={step.num} className="flex flex-1 items-start md:flex-col md:items-center md:text-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                                    {step.num}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <ChevronRight className="hidden md:block text-muted-foreground mx-2 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-4 sm:px-6">
                <div className="mx-auto max-w-6xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <GraduationCap className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold">StudyGenie</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Built for the students of tomorrow. Let AI guide your learning journey.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} StudyGenie. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
