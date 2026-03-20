import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoginForm, RegisterForm } from '../components/AuthForms'
import { GraduationCap, Sparkles, Target, Zap } from 'lucide-react'

export default function LoginPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)

    if (user) {
        navigate('/')
        return null
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left form side */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 bg-background">
                <div className="flex items-center gap-2.5 mb-10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <GraduationCap className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">StudyGenie</span>
                </div>

                {isLogin ? (
                    <LoginForm onToggle={() => setIsLogin(false)} />
                ) : (
                    <RegisterForm onToggle={() => setIsLogin(true)} />
                )}

                <p className="mt-8 text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} StudyGenie. Let's learn smarter.
                </p>
            </div>

            {/* Right feature side — hidden on mobile */}
            <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-start justify-center p-12 lg:p-16 max-w-lg">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90 mb-8">
                        <Sparkles className="h-4 w-4" />
                        <span>AI-Powered Learning</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight mb-8">
                        Master your syllabus with intelligent study plans.
                    </h1>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Instant Generation</h3>
                                <p className="text-sm text-white/70 mt-1">Upload your courses and get a day-by-day roadmap in seconds.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Adaptive Quizzes</h3>
                                <p className="text-sm text-white/70 mt-1">Test your knowledge with AI quizzes that adjust to your skill level.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
