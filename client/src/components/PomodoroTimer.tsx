import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PomodoroTimerProps {
    defaultWorkTime?: number
    defaultBreakTime?: number
}

export const PomodoroTimer = ({ defaultWorkTime = 25, defaultBreakTime = 5 }: PomodoroTimerProps) => {
    const [mode, setMode] = useState<'work' | 'break'>('work')
    const [timeLeft, setTimeLeft] = useState(defaultWorkTime * 60)
    const [isActive, setIsActive] = useState(false)

    const switchMode = useCallback(() => {
        const newMode = mode === 'work' ? 'break' : 'work'
        setMode(newMode)
        setTimeLeft(newMode === 'work' ? defaultWorkTime * 60 : defaultBreakTime * 60)
        setIsActive(false)
    }, [mode, defaultWorkTime, defaultBreakTime])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((time) => time - 1), 1000)
        } else if (isActive && timeLeft === 0) {
            switchMode()
        }
        return () => { if (interval) clearInterval(interval) }
    }, [isActive, timeLeft, switchMode])

    const toggleTimer = () => setIsActive(!isActive)
    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(mode === 'work' ? defaultWorkTime * 60 : defaultBreakTime * 60)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const totalSeconds = mode === 'work' ? defaultWorkTime * 60 : defaultBreakTime * 60
    const progressPct = ((totalSeconds - timeLeft) / totalSeconds) * 100
    const circumference = 54 * 2 * Math.PI
    const strokeDashoffset = circumference - (progressPct / 100) * circumference

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                    <span>{mode === 'work' ? '🧠 Study Time' : '☕ Break Time'}</span>
                    <div className="flex rounded-md overflow-hidden border">
                        <button
                            onClick={() => { setMode('work'); setTimeLeft(defaultWorkTime * 60); setIsActive(false) }}
                            className={cn('px-2.5 py-1 text-xs font-medium transition-colors', mode === 'work' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                        >Work</button>
                        <button
                            onClick={() => { setMode('break'); setTimeLeft(defaultBreakTime * 60); setIsActive(false) }}
                            className={cn('px-2.5 py-1 text-xs font-medium transition-colors', mode === 'break' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                        >Break</button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {/* Timer SVG */}
                <div className="relative">
                    <svg width="120" height="120" className="-rotate-90">
                        <circle cx="60" cy="60" r="54" strokeWidth="6" className="fill-none stroke-muted" />
                        <circle cx="60" cy="60" r="54" strokeWidth="6"
                            className={cn('fill-none transition-all duration-500', mode === 'work' ? 'stroke-primary' : 'stroke-mastered')}
                            style={{ strokeDasharray: circumference, strokeDashoffset }} strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                    <Button size="sm" onClick={toggleTimer} className={cn(mode === 'break' && 'bg-mastered hover:bg-mastered/90')}>
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetTimer}>Reset</Button>
                </div>
            </CardContent>
        </Card>
    )
}
