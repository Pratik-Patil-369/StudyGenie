import { useState, useEffect } from 'react'
import { apiGet } from '../utils/api'
import { Flame, Trophy, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface LeaderboardUser {
    _id: string
    full_name: string
    email: string
    xp: number
    currentStreak: number
}

export const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await apiGet('/users/leaderboard')
                setUsers(data)
            } catch (err: any) {
                console.error('Failed to load leaderboard', err)
                setError('Could not load leaderboard.')
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    const getMedal = (index: number) => {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return null
    }

    if (loading) return (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading Leaderboard...
        </div>
    )
    if (error || users.length === 0) return null

    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" /> Top Learners
            </h3>
            <div className="space-y-2">
                {users.map((user, index) => (
                    <div key={user._id} className={cn(
                        'flex items-center gap-3 rounded-lg p-3 transition-colors',
                        index < 3 ? 'bg-primary/5' : 'hover:bg-muted/50'
                    )}>
                        <div className="w-8 text-center shrink-0">
                            {getMedal(index) ? (
                                <span className="text-lg">{getMedal(index)}</span>
                            ) : (
                                <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                            )}
                        </div>
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">{user.full_name || user.email.split('@')[0]}</span>
                            {user.currentStreak > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" /> {user.currentStreak} day streak
                                </span>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-primary">{user.xp}</span>
                            <span className="text-xs text-muted-foreground ml-1">XP</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
