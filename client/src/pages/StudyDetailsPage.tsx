import { useState, useRef, useEffect, type FormEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../utils/api'
import { usePageTitle } from '../hooks/usePageTitle'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const GRADES = ['A', 'B', 'C', 'D', 'F']
const STORAGE_KEY = 'studygenie_new_plan_form'

export default function StudyDetailsPage() {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [statusMsg, setStatusMsg] = useState('')
    usePageTitle('Create Study Plan')

    const saved = sessionStorage.getItem(STORAGE_KEY)
    const [form, setForm] = useState(saved ? JSON.parse(saved) : {
        title: '', syllabus: '', start_date: '', end_date: '', subject: '', current_grade: '',
    })

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    }, [form])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleDrag = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (file: File) => {
        const allowed = ['application/pdf', 'text/plain']
        if (!allowed.includes(file.type)) {
            setError('Only PDF and TXT files are allowed')
            return
        }
        setSelectedFile(file)
        setError('')
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setStatusMsg('')

        if (!selectedFile && !form.syllabus.trim()) {
            setError('Please upload a syllabus file or type your syllabus topics')
            return
        }

        setLoading(true)
        try {
            setStatusMsg(selectedFile ? 'Uploading file and extracting topics...' : 'Creating study plan...')
            const formData = new FormData()
            formData.append('title', form.title)
            formData.append('subject', form.subject)
            formData.append('start_date', form.start_date)
            formData.append('end_date', form.end_date)
            formData.append('current_grade', form.current_grade)
            formData.append('syllabus', form.syllabus)
            if (selectedFile) formData.append('syllabus_file', selectedFile)

            const plan = await apiUpload('/study-plans', formData)

            if (plan.warning) {
                setStatusMsg(plan.warning)
                setTimeout(() => { sessionStorage.removeItem(STORAGE_KEY); navigate(`/plans/${plan._id}/topics`) }, 3000)
            } else if (plan.topics && plan.topics.length > 0) {
                setStatusMsg(`Extracted ${plan.topics.length} topics! Redirecting...`)
                setTimeout(() => { sessionStorage.removeItem(STORAGE_KEY); navigate(`/plans/${plan._id}/topics`) }, 1000)
            } else {
                sessionStorage.removeItem(STORAGE_KEY)
                navigate('/')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setStatusMsg('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create Study Plan</h1>
                <p className="text-muted-foreground mt-1">Fill in your study details and upload a syllabus file for automatic topic extraction.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                {statusMsg && (
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> {statusMsg}
                    </div>
                )}

                {/* Plan Details */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Midterm Exam Preparation" value={form.title} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" name="subject" placeholder="e.g. Mathematics, Physics" value={form.subject} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="current_grade">Current Grade</Label>
                            <select
                                id="current_grade"
                                name="current_grade"
                                value={form.current_grade}
                                onChange={handleChange}
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Select Grade</option>
                                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Syllabus Upload */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Syllabus</CardTitle>
                        <CardDescription>Upload a PDF/TXT file or type topics manually</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={cn(
                                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
                                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className={cn('h-8 w-8 mb-3', dragActive ? 'text-primary' : 'text-muted-foreground')} />
                            <p className="text-sm font-medium">
                                <span className="text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF or TXT (max 10MB) — Topics will be auto-extracted</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />
                        </div>

                        {selectedFile && (
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-sm font-medium flex-1 truncate">{selectedFile.name}</span>
                                <button type="button" onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {!selectedFile && (
                            <div className="space-y-2">
                                <Label htmlFor="syllabus">Or type your syllabus topics</Label>
                                <textarea
                                    id="syllabus"
                                    name="syllabus"
                                    placeholder="Enter your syllabus topics, one per line..."
                                    value={form.syllabus}
                                    onChange={handleChange}
                                    rows={5}
                                    maxLength={5000}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {statusMsg || 'Creating...'}</> : 'Create Study Plan'}
                </Button>
            </form>
        </div>
    )
}
