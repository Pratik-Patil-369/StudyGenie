import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet, apiPut } from '../utils/api'
import { toast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { Check, Trash2, Plus, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Subtopic {
    name: string
    completed: boolean
}

interface Topic {
    _id?: string
    name: string
    subtopics: Subtopic[]
    order: number
    completed: boolean
}

function SubtopicList({ subtopics, onToggle }: { subtopics: Subtopic[], onToggle: (idx: number) => void }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const shouldShowToggle = subtopics.length > 5

    const displayedSubtopics = isExpanded ? subtopics : subtopics.slice(0, 5)

    return (
        <div className="mt-3 ml-7">
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {displayedSubtopics.map((sub, si) => (
                    <li key={si} className="group/sub relative flex items-start gap-2.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(si) }}
                            className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                sub.completed
                                    ? "bg-mastered border-mastered text-white"
                                    : "border-muted-foreground/30 hover:border-primary bg-background"
                            )}
                        >
                            {sub.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </button>
                        <span className={cn(
                            "text-sm transition-colors",
                            sub.completed ? "text-muted-foreground/60 line-through" : "text-muted-foreground hover:text-foreground cursor-pointer"
                        )}
                            onClick={() => onToggle(si)}
                        >
                            {sub.name}
                        </span>
                    </li>
                ))}
            </ul>
            {shouldShowToggle && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
                    className="mt-4 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronUp className="h-4 w-4" /></>
                    ) : (
                        <>+ {subtopics.length - 5} more items <ChevronDown className="h-4 w-4" /></>
                    )}
                </button>
            )}
        </div>
    )
}

export default function TopicsPage() {
    const { id } = useParams<{ id: string }>()
    const [topics, setTopics] = useState<Topic[]>([])
    const [fileName, setFileName] = useState<string | null>(null)
    const [planTitle, setPlanTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [newTopic, setNewTopic] = useState('')
    const [saving, setSaving] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        fetchTopics()
    }, [id])

    usePageTitle(planTitle ? `Topics — ${planTitle}` : 'Study Topics')

    const fetchTopics = async () => {
        try {
            const data = await apiGet(`/study-plans/${id}/topics`)
            const normalized = (data.topics || []).map((t: any) => ({
                ...t,
                subtopics: (t.subtopics || []).map((s: any) =>
                    typeof s === 'string' ? { name: s, completed: false } : s
                )
            }))
            setTopics(normalized)
            setFileName(data.file_name)
            if (data.plan_title) setPlanTitle(data.plan_title)
        } catch (err) {
            console.error('Failed to fetch topics')
        } finally {
            setLoading(false)
        }
    }

    const saveTopics = useCallback((updatedTopics: Topic[]) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setSaving(true)
        debounceRef.current = setTimeout(async () => {
            try {
                await apiPut(`/study-plans/${id}/topics`, { topics: updatedTopics })
            } catch (err) {
                toast('Failed to save topics', 'error')
            } finally {
                setSaving(false)
            }
        }, 500)
    }, [id])

    const addTopic = () => {
        if (!newTopic.trim()) return
        const updated = [...topics, { name: newTopic.trim(), subtopics: [], order: topics.length, completed: false }]
        setTopics(updated)
        setNewTopic('')
        saveTopics(updated)
        toast(`"${newTopic.trim()}" added`)
    }

    const removeTopic = (index: number) => {
        const name = topics[index].name
        const updated = topics.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i }))
        setTopics(updated)
        saveTopics(updated)
        toast(`"${name}" removed`, 'info')
    }

    const toggleComplete = (index: number) => {
        const updated = topics.map((t, i) => i === index ? { ...t, completed: !t.completed } : t)
        setTopics(updated)
        saveTopics(updated)
        const topic = topics[index]
        toast(topic.completed ? `"${topic.name}" marked incomplete` : `"${topic.name}" completed! ✓`)
    }

    const toggleSubtopic = (topicIndex: number, subIndex: number) => {
        const updated = [...topics]
        const topic = { ...updated[topicIndex] }
        const subs = [...topic.subtopics]
        subs[subIndex] = { ...subs[subIndex], completed: !subs[subIndex].completed }
        topic.subtopics = subs
        updated[topicIndex] = topic
        setTopics(updated)
        saveTopics(updated)
    }

    const completedCount = topics.filter(t => t.completed).length
    const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i}><CardContent className="p-4 flex items-center gap-4">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-5 flex-1" />
                        <Skeleton className="h-8 w-20" />
                    </CardContent></Card>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Study Topics</h1>
                        {saving && <Badge variant="secondary" className="text-xs">Saving...</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-1">
                        {fileName ? `Extracted from: ${fileName}` : 'Manage your study topics'}
                        {topics.length > 0 && ` · ${completedCount}/${topics.length} completed`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild><Link to="/">Dashboard</Link></Button>
                    <Button variant="outline" asChild><Link to={`/plans/${id}/quiz`}>Take Quiz</Link></Button>
                    <Button asChild><Link to={`/plans/${id}/daily-plan`}>Daily Plan</Link></Button>
                </div>
            </div>

            {/* Progress bar */}
            {topics.length > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-semibold text-primary">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                </div>
            )}

            {/* Topics list */}
            {topics.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
                        <p className="text-muted-foreground max-w-sm">Upload a syllabus file or add topics manually below.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {topics.map((topic, index) => (
                        <Card key={index} className={cn(
                            'group transition-all',
                            topic.completed && 'bg-mastered/5 border-mastered/20'
                        )}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <button
                                    onClick={() => toggleComplete(index)}
                                    className={cn(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                        topic.completed
                                            ? 'bg-mastered border-mastered text-white'
                                            : 'border-border hover:border-primary'
                                    )}
                                >
                                    {topic.completed && <Check className="h-3.5 w-3.5" />}
                                </button>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span className={cn('font-semibold text-base', topic.completed && 'line-through text-muted-foreground')}>
                                            {topic.name}
                                        </span>
                                        {topic.subtopics.length > 0 && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium opacity-70">
                                                {topic.subtopics.filter(s => s.completed).length}/{topic.subtopics.length} items
                                            </Badge>
                                        )}
                                    </div>
                                    {topic.subtopics.length > 0 && (
                                        <SubtopicList
                                            subtopics={topic.subtopics}
                                            onToggle={(si) => toggleSubtopic(index, si)}
                                        />
                                    )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleComplete(index) }} title={topic.completed ? 'Mark incomplete' : 'Mark complete'}>
                                        <Check className={cn('h-4 w-4', topic.completed ? 'text-mastered' : 'text-muted-foreground')} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeTopic(index) }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add new topic */}
            <div className="flex gap-3">
                <Input
                    placeholder="Add a new topic... (Enter to add)"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addTopic() }
                        if (e.key === 'Escape') setNewTopic('')
                    }}
                    className="flex-1"
                />
                <Button onClick={addTopic} disabled={saving || !newTopic.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
            </div>
        </div>
    )
}
