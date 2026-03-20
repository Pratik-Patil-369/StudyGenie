import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 animate-fade-in">
                    <Card className="max-w-[500px] w-full pt-8 pb-10 px-6 border-destructive/20 border-2">
                        <CardContent className="flex flex-col items-center">
                            <div className="bg-destructive/10 p-4 rounded-full mb-6">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold mb-3 tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                                We apologize, but an unexpected error has occurred. Our team has been notified.
                            </p>

                            <div className="flex flex-wrap gap-3 justify-center">
                                <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                                    <RefreshCw className="h-4 w-4" /> Reload Page
                                </Button>
                                <Button asChild className="gap-2">
                                    <Link to="/" onClick={() => this.setState({ hasError: false })}>
                                        <Home className="h-4 w-4" /> Go to Dashboard
                                    </Link>
                                </Button>
                            </div>

                            {this.state.error && (
                                <div className="mt-8 pt-6 border-t w-full text-left">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2 px-1">Error Trace</p>
                                    <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[150px] text-destructive scrollbar-thin">
                                        {this.state.error.toString()}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
