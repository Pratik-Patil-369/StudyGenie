import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/Toast'
import { apiPost } from '../utils/api'

export default function OTPPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [isLoading, setIsLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [timer, setTimer] = useState(60)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (!email) {
            navigate('/login')
            return
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(interval)
    }, [email, navigate])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const code = otp.join('')
        if (code.length < 6) {
            toast('Please enter the full 6-digit code', 'error')
            return
        }

        setIsLoading(true)
        try {
            await apiPost('/auth/verify-otp', { email, code })
            toast('Email verified successfully! Welcome to StudyGenie.', 'success')
            navigate('/dashboard')
        } catch (err: any) {
            toast(err.message || 'Verification failed', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (timer > 0) return
        setResendLoading(true)
        try {
            await apiPost('/auth/resend-otp', { email })
            toast('A new code has been sent to your email.', 'success')
            setTimer(60)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } catch (err: any) {
            toast(err.message || 'Failed to resend code', 'error')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
                    <p className="text-muted-foreground">
                        We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-between gap-2">
                        {otp.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el: HTMLInputElement | null) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="h-14 w-full border-2 text-center text-2xl font-bold focus-visible:ring-primary md:h-16"
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                                </>
                            ) : (
                                'Verify Identity'
                            )}
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            Didn't receive the code?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={timer > 0 || resendLoading}
                                className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                {resendLoading ? (
                                    <RefreshCw className="inline-block h-3 w-3 animate-spin mr-1" />
                                ) : null}
                                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="pt-4">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
