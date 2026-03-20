import { Link } from 'react-router-dom'
import { Telescope, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in">
            <Card className="max-w-[450px] w-full pt-8 pb-10 px-6 overflow-hidden border-2">
                <CardContent className="flex flex-col items-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-6">
                        <Telescope className="h-16 w-16 text-primary" />
                    </div>
                    <h1 className="text-6xl font-black text-foreground mb-2 tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold mb-3">Lost in Space?</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-[280px]">
                        The page you are looking for has drifted out of orbit or doesn't exist.
                    </p>
                    <Button asChild className="gap-2">
                        <Link to="/">
                            <Home className="h-4 w-4" /> Return to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
