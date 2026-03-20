import { Link, useLocation, useParams } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ planTitle }: { planTitle?: string }) {
    const location = useLocation()
    const { id } = useParams()

    const paths = location.pathname.split('/').filter(p => p)

    if (paths.length === 0 || paths[0] === 'analytics' || paths[0] === 'leaderboard' || paths[0] === 'settings') {
        return null
    }

    return (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 font-medium">
            <Link to="/" className="hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
            </Link>

            {paths[0] === 'plans' && id && (
                <>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link to={`/plans/${id}/daily-plan`} className="hover:text-foreground transition-colors">
                        {planTitle || 'Study Plan'}
                    </Link>

                    {paths[2] && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="text-foreground capitalize">{paths[2].replace('-', ' ')}</span>
                        </>
                    )}
                </>
            )}

            {paths[0] === 'new-plan' && (
                <>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">New Plan</span>
                </>
            )}

            {paths[0] === 'profile' && (
                <>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">Profile</span>
                </>
            )}
        </nav>
    )
}
