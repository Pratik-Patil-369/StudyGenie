import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPut } from '../utils/api';

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
    const [loading, setLoading] = useState(true);
    const [newTopic, setNewTopic] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, [id]);

    const fetchTopics = async () => {
        try {
            const data = await apiGet(`/study-plans/${id}/topics`);
            setTopics(data.topics || []);
            setFileName(data.file_name);
        } catch (err) {
            console.error('Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    };

    const saveTopics = async (updatedTopics: Topic[]) => {
        setSaving(true);
        try {
            await apiPut(`/study-plans/${id}/topics`, { topics: updatedTopics });
        } catch (err) {
            console.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const addTopic = () => {
        if (!newTopic.trim()) return;
        const updated = [...topics, { name: newTopic.trim(), subtopics: [], order: topics.length, completed: false }];
        setTopics(updated);
        setNewTopic('');
        saveTopics(updated);
    };

    const removeTopic = (index: number) => {
        const updated = topics.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i }));
        setTopics(updated);
        saveTopics(updated);
    };

    const toggleComplete = (index: number) => {
        const updated = topics.map((t, i) => i === index ? { ...t, completed: !t.completed } : t);
        setTopics(updated);
        saveTopics(updated);
    };

    const completedCount = topics.filter(t => t.completed).length;

    if (loading) return <div className="loading">Loading topics...</div>;

    return (
        <div className="topics-page">
            <div className="topics-header">
                <div>
                    <h1>Study Topics</h1>
                    <p className="page-subtitle">
                        {fileName ? `Extracted from: ${fileName}` : 'Manage your study topics'}
                        {topics.length > 0 && ` | ${completedCount}/${topics.length} completed`}
                    </p>
                </div>
                <Link to="/" className="btn-secondary">Back</Link>
            </div>

            {topics.length === 0 ? (
                <div className="empty-state">
                    <h2>No topics yet</h2>
                    <p>Upload a syllabus file or add topics manually below.</p>
                </div>
            ) : (
                <ul className="topic-list">
                    {topics.map((topic, index) => (
                        <li className="topic-item" key={index} style={topic.completed ? { opacity: 0.6 } : {}}>
                            <div className="topic-item-header">
                                <span className="topic-number">{index + 1}</span>
                                <span className="topic-name" style={topic.completed ? { textDecoration: 'line-through' } : {}}>
                                    {topic.name}
                                </span>
                                <div className="topic-actions">
                                    <button
                                        onClick={() => toggleComplete(index)}
                                        title={topic.completed ? 'Mark incomplete' : 'Mark complete'}
                                        className={topic.completed ? 'completed' : ''}
                                    >
                                        {topic.completed ? 'Done' : 'Mark'}
                                    </button>
                                    <button onClick={() => removeTopic(index)} title="Remove" className="btn-danger">
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
                    placeholder="Add a new topic..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <button className="btn-primary" onClick={addTopic} disabled={saving}>
                    {saving ? '...' : '+ Add'}
                </button>
            </div>
        </div>
    );
}
