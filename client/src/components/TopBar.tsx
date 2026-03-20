import { Bell, Flame, Sun, Moon, Check, CheckCircle2, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { apiGet, apiPut } from '../utils/api'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Notification {
    _id: string
    type: string
    message: string
    link?: string
    read: boolean
    createdAt: string
}

interface TopBarProps {
    onMenuClick?: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { theme, setTheme, isDark } = useTheme()

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)

    // Close notif dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Polling logic
    const fetchNotifications = async () => {
        if (!user) return
        try {
            const data = await apiGet('/notifications')
            if (data) {
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [user])

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            try {
                await apiPut(`/notifications/${notif._id}/read`)
                setUnreadCount(prev => Math.max(0, prev - 1))
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
            } catch (err) {
                console.error('Failed to mark read', err)
            }
        }
        setIsNotifOpen(false)
        if (notif.link) {
            navigate(notif.link)
        }
    }

    const markAllRead = async () => {
        try {
            await apiPut('/notifications/read-all')
            setUnreadCount(0)
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch (err) {
            console.error('Failed to mark all read', err)
        }
    }

    if (!user) return null

    // Determine page title based on route
    let pageTitle = 'Dashboard'
    if (location.pathname === '/new-plan') pageTitle = 'Create Study Plan'
    if (location.pathname === '/analytics') pageTitle = 'Analytics'
    if (location.pathname === '/leaderboard') pageTitle = 'Leaderboard'
    if (location.pathname === '/settings') pageTitle = 'Settings'
    if (location.pathname === '/profile') pageTitle = 'Profile'
    if (location.pathname.includes('/topics')) pageTitle = 'Topics'
    if (location.pathname.includes('/daily-plan')) pageTitle = 'Daily Plan'
    if (location.pathname.includes('/quiz')) pageTitle = 'Quiz'
    if (location.pathname.includes('/review')) pageTitle = 'Quiz Review'
    if (location.pathname.includes('/flashcards')) pageTitle = 'Flashcards'

    const userInitial = user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
    const userName = user.full_name || user.email.split('@')[0]

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Page title */}
            <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
                {/* Streak badge */}
                {user.currentStreak !== undefined && user.currentStreak > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-500" title={`${user.currentStreak} day study streak!`}>
                        <Flame className="h-4 w-4" />
                        <span>{user.currentStreak}</span>
                    </div>
                )}

                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <Button variant="ghost" size="icon" onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                        )}
                    </Button>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg animate-fade-in z-50">
                            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                                <h4 className="text-sm font-semibold">Notifications</h4>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                                        <Check className="h-3 w-3" /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-64 space-y-1 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={cn(
                                                'flex gap-3 rounded-md p-2.5 transition-colors',
                                                notif.read ? 'opacity-60' : 'bg-primary/5 border-l-2 border-primary',
                                                notif.link && 'cursor-pointer hover:bg-accent'
                                            )}
                                        >
                                            <CheckCircle2 className={cn('h-4 w-4 mt-0.5 shrink-0', notif.read ? 'text-muted-foreground' : 'text-primary')} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-snug">{notif.message}</p>
                                                <span className="text-xs text-muted-foreground mt-1 block">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User avatar */}
                <Link to="/profile" className="flex items-center gap-2 no-underline">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-foreground">{userName}</span>
                </Link>
            </div>
        </header>
    )
}
