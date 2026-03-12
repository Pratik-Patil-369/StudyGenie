import { useState, useEffect, useCallback } from 'react';
import './PomodoroTimer.css';

interface PomodoroTimerProps {
    defaultWorkTime?: number; // in minutes
    defaultBreakTime?: number; // in minutes
}

export const PomodoroTimer = ({ defaultWorkTime = 25, defaultBreakTime = 5 }: PomodoroTimerProps) => {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(defaultWorkTime * 60);
    const [isActive, setIsActive] = useState(false);

    const switchMode = useCallback(() => {
        const newMode = mode === 'work' ? 'break' : 'work';
        setMode(newMode);
        setTimeLeft(newMode === 'work' ? defaultWorkTime * 60 : defaultBreakTime * 60);
        setIsActive(false);
    }, [mode, defaultWorkTime, defaultBreakTime]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Play a sound when timer finishes (optional, maybe just visual for now)
            switchMode();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, switchMode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'work' ? defaultWorkTime * 60 : defaultBreakTime * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercentage = mode === 'work'
        ? ((defaultWorkTime * 60 - timeLeft) / (defaultWorkTime * 60)) * 100
        : ((defaultBreakTime * 60 - timeLeft) / (defaultBreakTime * 60)) * 100;

    return (
        <div className={`pomodoro-widget ${mode}`}>
            <div className="pomodoro-header">
                <span className="pomodoro-title">
                    {mode === 'work' ? '🧠 Study Time' : '☕ Break Time'}
                </span>
                <div className="pomodoro-toggles">
                    <button
                        className={`mode-toggle ${mode === 'work' ? 'active' : ''}`}
                        onClick={() => { setMode('work'); setTimeLeft(defaultWorkTime * 60); setIsActive(false); }}
                    >
                        Work
                    </button>
                    <button
                        className={`mode-toggle ${mode === 'break' ? 'active' : ''}`}
                        onClick={() => { setMode('break'); setTimeLeft(defaultBreakTime * 60); setIsActive(false); }}
                    >
                        Break
                    </button>
                </div>
            </div>

            <div className="pomodoro-display">
                <div className="time-left">{formatTime(timeLeft)}</div>
                <div className="progress-ring-container">
                    <svg className="progress-ring" width="120" height="120">
                        <circle className="progress-ring-circle-bg" strokeWidth="6" cx="60" cy="60" r="54" />
                        <circle
                            className="progress-ring-circle"
                            strokeWidth="6"
                            cx="60"
                            cy="60"
                            r="54"
                            style={{ strokeDasharray: `${54 * 2 * Math.PI}`, strokeDashoffset: `${54 * 2 * Math.PI - (progressPercentage / 100) * 54 * 2 * Math.PI}` }}
                        />
                    </svg>
                </div>
            </div>

            <div className="pomodoro-controls">
                <button className={`btn-primary play-btn ${isActive ? 'paused' : ''}`} onClick={toggleTimer}>
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button className="btn-secondary reset-btn" onClick={resetTimer}>
                    Reset
                </button>
            </div>
        </div>
    );
};
