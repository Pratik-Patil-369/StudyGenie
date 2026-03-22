import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AuthFormProps {
    onToggle: () => void
}

const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score === 1) return 'bg-destructive'
    if (score === 2) return 'bg-warning'
    if (score === 3) return 'bg-mastered'
    return 'bg-emerald-600'
}

const getStrengthLabel = (score: number) => {
    if (score === 0) return 'Too short'
    if (score === 1) return 'Weak'
    if (score === 2) return 'Fair'
    if (score === 3) return 'Good'
    return 'Strong'
}

const calculateStrength = (pass: string) => {
    let score = 0
    if (!pass) return score
    if (pass.length > 5) score += 1
    if (pass.length > 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9!@#$%^&*]/.test(pass)) score += 1
    return Math.min(score, 4)
}

export function LoginForm({ onToggle }: AuthFormProps) {
    const navigate = useNavigate()
    const { login, googleLogin, isLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const data = await login(email, password)
            if (data?.verificationRequired) {
                navigate('/verify-otp', { state: { email: data.email || email } })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
            <div className="space-y-2 mb-2">
                <h2 className="text-3xl font-extrabold tracking-tight">Welcome back</h2>
                <p className="text-muted-foreground">Sign in to continue your learning journey</p>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                    <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full mt-2">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign in'}
            </Button>

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            await googleLogin(credentialResponse.credential!)
                            toast.success('Login successful!')
                            navigate('/dashboard')
                        } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Google login failed')
                        }
                    }}
                    onError={() => {
                        toast.error('Google login failed')
                    }}
                    useOneTap
                    theme="outline"
                    width="350"
                />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-2">
                Don't have an account?{' '}
                <button type="button" onClick={onToggle} className="text-primary font-semibold hover:underline">
                    Create one
                </button>
            </p>
        </form>
    )
}

export function RegisterForm({ onToggle }: AuthFormProps) {
    const navigate = useNavigate()
    const { register, googleLogin, isLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const strength = calculateStrength(password)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const data = await register(email, password, fullName)
            if (data?.verificationRequired) {
                navigate('/verify-otp', { state: { email: data.email || email } })
            } else if (data?.user) {
                toast.success('Registration successful!')
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
            <div className="space-y-2 mb-2">
                <h2 className="text-3xl font-extrabold tracking-tight">Create an account</h2>
                <p className="text-muted-foreground">Start your personalized study journey today.</p>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                    <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                    <div className="space-y-1">
                        <div className="flex gap-1 h-1 rounded-full overflow-hidden">
                            {[1, 2, 3, 4].map((level) => (
                                <div
                                    key={level}
                                    className={cn(
                                        'flex-1 rounded-full transition-colors duration-300',
                                        level <= strength ? getStrengthColor(strength) : 'bg-border'
                                    )}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{getStrengthLabel(strength)}</p>
                    </div>
                )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full mt-2">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create account'}
            </Button>

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            await googleLogin(credentialResponse.credential!)
                            toast.success('Login successful!')
                            navigate('/dashboard')
                        } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Google login failed')
                        }
                    }}
                    onError={() => {
                        toast.error('Google login failed')
                    }}
                    useOneTap
                    theme="outline"
                    width="350"
                />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{' '}
                <button type="button" onClick={onToggle} className="text-primary font-semibold hover:underline">
                    Sign in
                </button>
            </p>
        </form>
    )
}
