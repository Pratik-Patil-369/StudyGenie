import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPut } from '../utils/api';
import { toast } from '../components/Toast';
import { usePageTitle } from '../hooks/usePageTitle';

interface Topic {
    _id?: string;
    name: string;
    subtopics: string[];
    order: number;
    completed: boolean;
}

export default function TopicsPage() {
    const { id } = useParams<{ id: string }>();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [planTitle, setPlanTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [newTopic, setNewTopic] = useState('');
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchTopics();
    }, [id]);

    usePageTitle(planTitle ? `Topics — ${planTitle}` : 'Study Topics');

    const fetchTopics = async () => {
        try {
            const data = await apiGet(`/study-plans/${id}/topics`);
            setTopics(data.topics || []);
            setFileName(data.file_name);
            if (data.plan_title) setPlanTitle(data.plan_title);
        } catch (err) {
            console.error('Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    };

    // Debounced save — waits 500ms after last change before sending request
    const saveTopics = useCallback((updatedTopics: Topic[]) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSaving(true);
        debounceRef.current = setTimeout(async () => {
            try {
                await apiPut(`/study-plans/${id}/topics`, { topics: updatedTopics });
            } catch (err) {
                toast('Failed to save topics', 'error');
            } finally {
                setSaving(false);
            }
        }, 500);
    }, [id]);

    const addTopic = () => {
        if (!newTopic.trim()) return;
        const updated = [...topics, { name: newTopic.trim(), subtopics: [], order: topics.length, completed: false }];
        setTopics(updated);
        setNewTopic('');
        saveTopics(updated);
        toast(`"${newTopic.trim()}" added`);
    };

    const removeTopic = (index: number) => {
        const name = topics[index].name;
        const updated = topics.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i }));
        setTopics(updated);
        saveTopics(updated);
        toast(`"${name}" removed`, 'info');
    };

    const toggleComplete = (index: number) => {
        const updated = topics.map((t, i) => i === index ? { ...t, completed: !t.completed } : t);
        setTopics(updated);
        saveTopics(updated);
        const topic = topics[index];
        toast(topic.completed ? `"${topic.name}" marked incomplete` : `"${topic.name}" completed! ✓`);
    };

    const completedCount = topics.filter(t => t.completed).length;

    if (loading) return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">Loading topics...</p>
        </div>
    );

    return (
        <div className="topics-page">
            <div className="topics-header">
                <div>
                    <h1>Study Topics {saving && <span className="autosave-indicator">Saving...</span>}</h1>
                    <p className="page-subtitle">
                        {fileName ? `Extracted from: ${fileName}` : 'Manage your study topics'}
                        {topics.length > 0 && ` | ${completedCount}/${topics.length} completed`}
                    </p>
                </div>
                <div className="header-actions">
                    <Link to={`/plans/${id}/quiz`} className="btn-secondary">Take Adaptive Quiz</Link>
                    <Link to={`/plans/${id}/daily-plan`} className="btn-primary">Daily Study Plan</Link>
                    <Link to="/" className="btn-secondary">Back</Link>
                </div>
            </div>

            {topics.length === 0 ? (
                <div className="empty-state">
                    <h2>No topics yet</h2>
                    <p>Upload a syllabus file or add topics manually below.</p>
                </div>
            ) : (
                <ul className="topic-list">
                    {topics.map((topic, index) => (
                        <li className={`topic-item ${topic.completed ? 'completed' : ''}`} key={index}>
                            <div className="topic-item-header">
                                <span className="topic-number">{index + 1}</span>
                                <span className="topic-name">{topic.name}</span>
                                <div className="topic-actions">
                                    <button
                                        onClick={() => toggleComplete(index)}
                                        title={topic.completed ? 'Mark incomplete' : 'Mark complete'}
                                        className={`btn-mark ${topic.completed ? 'completed' : ''}`}
                                    >
                                        {topic.completed ? '✓ Done' : 'Mark'}
                                    </button>
                                    <button onClick={() => removeTopic(index)} className="btn-remove">
                                        Remove
                                    </button>
                                </div>
                            </div>
                            {topic.subtopics.length > 0 && (
                                <ul className="subtopics-list">
                                    {topic.subtopics.map((sub, si) => (
                                        <li key={si}>{sub}</li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div className="add-topic-form">
                <input
                    type="text"
                    placeholder="Add a new topic... (Enter to add, Esc to clear)"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addTopic(); }
                        if (e.key === 'Escape') setNewTopic('');
                    }}
                />
                <button className="btn-primary" onClick={addTopic} disabled={saving}>
                    {saving ? '...' : '+ Add'}
                </button>
            </div>
        </div>
    );
}
