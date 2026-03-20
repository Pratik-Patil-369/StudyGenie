import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, BarChart3, Trophy, Settings, LogOut, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-plan', label: 'New Plan', icon: BookOpen },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

const accountItems = [
    { path: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
    onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    if (!user) return null

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="flex h-full flex-col bg-card border-r border-border">
            {/* Brand */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
                <Link to="/dashboard" className="flex items-center gap-2.5 no-underline" onClick={onNavigate}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <GraduationCap className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold text-foreground tracking-tight">StudyGenie</span>
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <div className="space-y-1">
                    <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </NavLink>
                    ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-1">
                    <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                    {accountItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </NavLink>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </ScrollArea>
        </div>
    )
}
