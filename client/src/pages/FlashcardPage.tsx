import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../utils/api'
import { toast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { RotateCw, Sparkles, LayoutGrid, ArrowRight, ArrowLeft, Folder, Loader2 } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Flashcard {
    _id: string
    question: string
    answer: string
    topic: string
    interval: number
    nextReviewDate: string
}

export default function FlashcardPage() {
    const { id } = useParams<{ id: string }>()
    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [viewMode, setViewMode] = useState<'due' | 'all' | 'decks'>('due')
    const [plan, setPlan] = useState<any>(null)
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [showTopicSelector, setShowTopicSelector] = useState(false)
    const [selectedDeck, setSelectedDeck] = useState<string | null>(null)
    const [bundleName, setBundleName] = useState('')
    const [deckType, setDeckType] = useState<'topics' | 'bundles'>('topics')
    const [allCards, setAllCards] = useState<Flashcard[]>([])
    const [selectedBundle, setSelectedBundle] = useState<string | null>(null)

    usePageTitle('AI Flashcards')

    const fetchCards = async (mode: 'due' | 'all' | 'decks' = viewMode, topic: string | null = selectedDeck, bundle: string | null = selectedBundle) => {
        if (mode === 'decks') {
            try {
                const data = await apiGet(`/flashcards/${id}/all`)
                setAllCards(data)
            } catch (err) {
                console.error('Failed to fetch all cards for decks', err)
            }
            return
        }
        setLoading(true)
        try {
            const topicQuery = topic ? `?topic=${encodeURIComponent(topic)}` : ''
            const bundleQuery = bundle ? `${topicQuery ? '&' : '?'}bundle=${encodeURIComponent(bundle)}` : ''
            const data = await apiGet(`/flashcards/${id}/${mode === 'due' ? 'due' : 'all'}${topicQuery}${bundleQuery}`)
            setCards(data)
            setCurrentIndex(0)
            setFlipped(false)
        } catch (err: any) {
            toast(err.message || 'Failed to load flashcards', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const fetchPlan = async () => {
            try { const data = await apiGet(`/study-plans/${id}`); setPlan(data) }
            catch (err) { console.error('Failed to fetch plan', err) }
        }
        fetchPlan()
        fetchCards(viewMode, selectedDeck, selectedBundle)
    }, [id, viewMode, selectedDeck, selectedBundle])

    const bundles = useMemo(() => {
        const uniqueBundles = Array.from(new Set(allCards.map(c => (c as any).bundleName || 'Default Bundle')))
        return uniqueBundles.map(name => ({ name, count: allCards.filter(c => (c as any).bundleName === name).length }))
    }, [allCards])

    const handleGenerate = async (topicList?: string[]) => {
        setGenerating(true)
        try {
            const topicsToUse = topicList || (selectedTopics.length > 0 ? selectedTopics : undefined)
            const data = await apiPost(`/flashcards/${id}/generate`, { topics: topicsToUse, bundleName: bundleName || undefined })
            toast(data.message || 'Flashcards generated!')
            setSelectedTopics([])
            setBundleName('')
            setShowTopicSelector(false)
            fetchCards()
        } catch (err: any) {
            toast(err.message || 'Failed to generate flashcards', 'error')
        } finally {
            setGenerating(false)
        }
    }

    const toggleTopic = (topicName: string) => {
        setSelectedTopics(prev => prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName])
    }

    const handleReview = async (quality: number) => {
        const currentCard = cards[currentIndex]
        try {
            await apiPost(`/flashcards/review/${currentCard._id}`, { quality })
            if (currentIndex < cards.length - 1) {
                setFlipped(false)
                setTimeout(() => setCurrentIndex(prev => prev + 1), 300)
            } else {
                toast("Session complete! You've reviewed all due cards.", 'success')
                fetchCards()
            }
        } catch (err: any) {
            toast(err.message || 'Failed to submit review', 'error')
        }
    }

    const currentCard = cards[currentIndex]

    const srsButtons = [
        { quality: 1, label: 'Forgot', color: 'bg-weak/10 text-weak border-weak/20 hover:bg-weak/20' },
        { quality: 2, label: 'Struggled', color: 'bg-revision/10 text-revision border-revision/20 hover:bg-revision/20' },
        { quality: 3, label: 'Okay', color: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20' },
        { quality: 4, label: 'Good', color: 'bg-focus/10 text-focus border-focus/20 hover:bg-focus/20' },
        { quality: 5, label: 'Perfect', color: 'bg-mastered/10 text-mastered border-mastered/20 hover:bg-mastered/20' },
    ]

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <Breadcrumb planTitle="Daily Plan" />
            <div className="flex flex-col items-center gap-4 py-16">
                <Skeleton className="w-full max-w-lg h-80 rounded-2xl" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <Breadcrumb planTitle="Daily Plan" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Study Flashcards</h1>
                    <p className="text-muted-foreground mt-1">Spaced repetition for long-term retention</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as any); if (v !== 'decks') { setSelectedDeck(null); setSelectedBundle(null) } }}>
                        <TabsList>
                            <TabsTrigger value="due"><RotateCw className="h-3.5 w-3.5 mr-1.5" /> Due</TabsTrigger>
                            <TabsTrigger value="decks"><LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Decks</TabsTrigger>
                            <TabsTrigger value="all"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Library</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={() => setShowTopicSelector(true)} disabled={generating}>
                        <Sparkles className="h-4 w-4 mr-1.5" /> {generating ? 'Generating...' : 'Generate New'}
                    </Button>
                </div>
            </div>

            {/* SRS info banner */}
            {viewMode === 'due' && (
                <Card className="border-l-4 border-l-primary bg-primary/5">
                    <CardContent className="p-4 flex gap-3 items-start">
                        <RotateCw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold">What is "Due for Review"?</h4>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                We use <strong className="text-primary">Spaced Repetition (SRS)</strong> to calculate when you're about to forget a concept.
                                Only cards needing reinforcement <em>right now</em> appear here.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generate Dialog */}
            <Dialog open={showTopicSelector && !!plan} onOpenChange={setShowTopicSelector}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Generate Flashcards</DialogTitle>
                        <DialogDescription>AI will create custom study materials for you</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bundle Name</Label>
                            <Input value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="e.g., Chapter 1, React Hooks..." />
                            <p className="text-xs text-muted-foreground">Organize your library into manageable bundles.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Select Topics</Label>
                                <button
                                    onClick={() => {
                                        if (selectedTopics.length === plan?.topics.length) setSelectedTopics([])
                                        else setSelectedTopics(plan?.topics.map((t: any) => t.name) || [])
                                    }}
                                    className="text-xs text-primary font-semibold hover:underline"
                                >
                                    {selectedTopics.length === plan?.topics?.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-muted/30">
                                {plan?.topics.map((t: any) => (
                                    <button key={t.name} onClick={() => toggleTopic(t.name)} className={cn(
                                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                        selectedTopics.includes(t.name)
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-muted-foreground hover:border-primary/50'
                                    )}>{t.name}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full" disabled={generating} onClick={() => {
                            if (selectedTopics.length > 0) handleGenerate()
                            else handleGenerate(plan?.topics.map((t: any) => t.name))
                        }}>
                            {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> AI is Working...</>
                                : selectedTopics.length > 0 ? `Generate for ${selectedTopics.length} Topic(s)` : 'Generate for All Topics'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Decks View */}
            {viewMode === 'decks' && plan && (
                <div className="space-y-4">
                    <Tabs value={deckType} onValueChange={(v) => setDeckType(v as any)}>
                        <TabsList>
                            <TabsTrigger value="topics">Sort by Topic</TabsTrigger>
                            <TabsTrigger value="bundles">Sort by Bundle</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deckType === 'topics' ? (
                            plan.topics.map((topic: any) => (
                                <Card key={topic.name} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
                                    onClick={() => { setSelectedDeck(topic.name); setSelectedBundle(null); setViewMode('all') }}>
                                    <CardContent className="p-5 text-center">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                                            <LayoutGrid className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold mb-1">{topic.name}</h3>
                                        <p className="text-sm text-muted-foreground">{allCards.filter(c => c.topic === topic.name).length} flashcards</p>
                                        <p className="text-sm font-semibold text-primary mt-3 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Study Topic <ArrowRight className="h-4 w-4" />
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            bundles.map((bundle) => (
                                <Card key={bundle.name} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
                                    onClick={() => { setSelectedBundle(bundle.name); setSelectedDeck(null); setViewMode('all') }}>
                                    <CardContent className="p-5 text-center">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 mb-3">
                                            <Folder className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold mb-1">{bundle.name}</h3>
                                        <p className="text-sm text-muted-foreground">{bundle.count} cards</p>
                                        <p className="text-sm font-semibold text-violet-500 mt-3 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Study Bundle <ArrowRight className="h-4 w-4" />
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Master Deck card */}
                        <Card className="cursor-pointer hover:shadow-md border-dashed transition-all group"
                            onClick={() => { setSelectedDeck(null); setSelectedBundle(null); setViewMode('all') }}>
                            <CardContent className="p-5 text-center">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground mb-3">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold mb-1">Master Deck</h3>
                                <p className="text-sm text-muted-foreground">All {allCards.length} cards mixed</p>
                                <p className="text-sm font-semibold mt-3 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start Session <ArrowRight className="h-4 w-4" />
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Active filter pill */}
            {viewMode !== 'decks' && (selectedDeck || selectedBundle) && (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary text-primary bg-primary/5">
                        Studying {selectedDeck ? 'Topic' : 'Bundle'}: <strong className="ml-1">{selectedDeck || selectedBundle}</strong>
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedDeck(null); setSelectedBundle(null); fetchCards(viewMode, null, null) }}>
                        Switch to master deck
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {viewMode !== 'decks' && cards.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {viewMode === 'due' ? 'No cards due for review' : 'No cards available'}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            {viewMode === 'due'
                                ? "You've finished your scheduled reviews! SRS minimizes study time by showing cards ONLY when you're about to forget them."
                                : "Start your study session by generating some AI flashcards from your syllabus topics."}
                        </p>
                        <div className="flex gap-3">
                            {viewMode === 'due' && <Button variant="outline" onClick={() => setViewMode('all')}>View Library</Button>}
                            <Button onClick={() => handleGenerate()} disabled={generating}>
                                {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating...</> : 'Generate 10 New Flashcards'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : viewMode !== 'decks' && (
                /* Flashcard Study View */
                <div className="flex flex-col items-center gap-6">
                    {/* 3D Flip Card */}
                    <div className="w-full max-w-lg" style={{ perspective: '1200px' }}>
                        <div
                            className="relative w-full cursor-pointer"
                            style={{ minHeight: '320px', transformStyle: 'preserve-3d', transition: 'transform 0.6s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
                            onClick={() => setFlipped(!flipped)}
                        >
                            {/* Front */}
                            <Card
                                className="absolute inset-0 flex flex-col shadow-xl border-2"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(0deg)'
                                }}
                            >
                                <CardContent className="flex-1 flex flex-col p-8">
                                    <Badge variant="secondary" className="self-start mb-4">{currentCard?.topic}</Badge>
                                    <p className="flex-1 flex items-center justify-center text-lg font-medium text-center leading-relaxed">{currentCard?.question}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center mt-4">
                                        <RotateCw className="h-3 w-3" /> Click to reveal answer
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Back */}
                            <Card
                                className="absolute inset-0 flex flex-col bg-primary/5 shadow-xl border-2 border-primary/20"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)'
                                }}
                            >
                                <CardContent className="flex-1 flex flex-col p-8">
                                    <Badge variant="default" className="self-start mb-4">Answer</Badge>
                                    <p className="flex-1 flex items-center justify-center text-lg font-medium text-center leading-relaxed">{currentCard?.answer}</p>
                                    <p className="text-xs text-primary flex items-center justify-center mt-4">How well did you know this?</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                        {flipped ? (
                            <div className="grid grid-cols-5 gap-2 w-full">
                                {srsButtons.map(({ quality, label, color }) => (
                                    <button key={quality} onClick={() => handleReview(quality)}
                                        className={cn('rounded-lg border p-2 text-center transition-all', color)}>
                                        <span className="block text-lg font-bold">{quality}</span>
                                        <span className="block text-xs">{label}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Card {currentIndex + 1} of {cards.length}</p>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" disabled={currentIndex === 0}
                                onClick={() => { setCurrentIndex(prev => prev - 1); setFlipped(false) }}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled={currentIndex === cards.length - 1}
                                onClick={() => { setCurrentIndex(prev => prev + 1); setFlipped(false) }}>
                                Skip <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
