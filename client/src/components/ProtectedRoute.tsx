import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full animate-spin" />
                <div className="space-y-2 flex flex-col items-center">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
