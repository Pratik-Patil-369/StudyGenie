import { useState, useRef, type FormEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUpload } from '../utils/api';

const GRADES = ['A', 'B', 'C', 'D', 'F'];

export default function StudyDetailsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [statusMsg, setStatusMsg] = useState('');

    const [form, setForm] = useState({
        title: '',
        syllabus: '',
        start_date: '',
        end_date: '',
        subject: '',
        current_grade: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDrag = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        const allowed = ['application/pdf', 'text/plain'];
        if (!allowed.includes(file.type)) {
            setError('Only PDF and TXT files are allowed');
            return;
        }
        setSelectedFile(file);
        setError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setStatusMsg('');

        if (!selectedFile && !form.syllabus.trim()) {
            setError('Please upload a syllabus file or type your syllabus topics');
            return;
        }

        setLoading(true);

        try {
            setStatusMsg(selectedFile ? 'Uploading file and extracting topics...' : 'Creating study plan...');

            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('subject', form.subject);
            formData.append('start_date', form.start_date);
            formData.append('end_date', form.end_date);
            formData.append('current_grade', form.current_grade);
            formData.append('syllabus', form.syllabus);

            if (selectedFile) {
                formData.append('syllabus_file', selectedFile);
            }

            const plan = await apiUpload('/study-plans', formData);

            if (plan.warning) {
                setStatusMsg(plan.warning);
                setTimeout(() => navigate(`/plans/${plan._id}/topics`), 3000);
            } else if (plan.topics && plan.topics.length > 0) {
                setStatusMsg(`Extracted ${plan.topics.length} topics! Redirecting...`);
                setTimeout(() => navigate(`/plans/${plan._id}/topics`), 1000);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setStatusMsg('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="study-details-page">
            <h1>Create Study Plan</h1>
            <p className="page-subtitle">Fill in your study details and upload a syllabus file for automatic topic extraction.</p>

            <form onSubmit={handleSubmit} className="study-form">
                {error && <p className="error">{error}</p>}
                {statusMsg && <p className="success-msg">{statusMsg}</p>}

                <div className="form-section-title">Plan Details</div>

                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="e.g. Midterm Exam Preparation"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="e.g. Mathematics, Physics, Computer Science"
                        value={form.subject}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">Start Date</label>
                        <input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end_date">End Date</label>
                        <input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="current_grade">Current Grade</label>
                    <select id="current_grade" name="current_grade" value={form.current_grade} onChange={handleChange} required>
                        <option value="">Select Grade</option>
                        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                <div className="form-section-title">Syllabus</div>

                <div
                    className={`file-upload-area ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="file-upload-icon">+</div>
                    <p className="file-upload-text">
                        <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p className="file-upload-hint">PDF or TXT (max 10MB) - Topics will be auto-extracted</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                </div>

                {selectedFile && (
                    <div className="file-name-display">
                        {selectedFile.name}
                        <button type="button" onClick={() => setSelectedFile(null)}>x</button>
                    </div>
                )}

                {!selectedFile && (
                    <div className="form-group">
                        <label htmlFor="syllabus">Or type your syllabus topics</label>
                        <textarea
                            id="syllabus"
                            name="syllabus"
                            placeholder="Enter your syllabus topics, one per line..."
                            value={form.syllabus}
                            onChange={handleChange}
                            rows={5}
                        />
                    </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (statusMsg || 'Creating...') : 'Create Study Plan'}
                </button>
            </form>
        </div>
    );
}
