import { Leaderboard } from '../components/Leaderboard'
import { Card, CardContent } from '@/components/ui/card'

export default function LeaderboardPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Global Leaderboard</h1>
                <p className="text-muted-foreground mt-1">See how you rank among all StudyGenie learners</p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardContent className="p-6 md:p-8">
                    <Leaderboard />
                </CardContent>
            </Card>
        </div>
    )
}
