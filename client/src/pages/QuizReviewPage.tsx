import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { usePageTitle } from '../hooks/usePageTitle';

interface QuizReviewData {
    _id: string;
    quiz: {
        _id: string;
        difficulty: string;
        topics: string[];
        study_plan: string;
        questions: {
            question: string;
            options: string[];
            answer: string;
            explanation: string;
        }[];
    };
    score: number;
    total_questions: number;
    percentage: number;
    completed_at: string;
    answers: {
        question_index: number;
        selected_option: string;
        is_correct: boolean;
    }[];
}

export default function QuizReviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<QuizReviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiExplanations, setAiExplanations] = useState<{ [key: number]: string }>({});
    const [explainingId, setExplainingId] = useState<number | null>(null);

    usePageTitle('Quiz Review');

    useEffect(() => {
        fetchResult();
    }, [id]);

    const fetchResult = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/quizzes/result/${id}`);
            setResult(data);
        } catch (err) {
            setError('Failed to load quiz result.');
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (questionIdx: number) => {
        if (!result) return;
        setExplainingId(questionIdx);
        
        const q = result.quiz.questions[questionIdx];
        const userAnsObj = result.answers.find(a => a.question_index === questionIdx);
        
        try {
            const data = await apiPost('/quizzes/explain', {
                question: q.question,
                options: q.options,
                correctAnswer: q.answer,
                userAnswer: userAnsObj?.selected_option || 'None',
                topic: result.quiz.topics?.[0] || 'General'
            });
            setAiExplanations(prev => ({ ...prev, [questionIdx]: data.explanation }));
        } catch (err) {
            console.error('Explanation Error:', err);
        } finally {
            setExplainingId(null);
        }
    };

    if (loading) return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">Loading quiz history...</p>
        </div>
    );

    if (error || !result) return (
        <div className="daily-plan-page">
            <div className="empty-state">
                <h2>Not Found</h2>
                <p>{error || 'Could not find this quiz.'}</p>
                <button onClick={() => navigate('/profile')} className="btn-primary" style={{ marginTop: '1rem' }}>
                    Back to Profile
                </button>
            </div>
        </div>
    );

    return (
        <div className="daily-plan-page quiz-page">
            <div className="page-header">
                <div>
                    <h1>Historical Quiz Review</h1>
                    <div className="header-actions" style={{ marginTop: '1rem' }}>
                        <button onClick={() => navigate('/profile')} className="btn-secondary">⬅ Back to Profile</button>
                    </div>
                </div>
                <div className={`difficulty-badge difficulty-${result.quiz.difficulty}`}>{result.quiz.difficulty} Mode</div>
            </div>

            <div className="results-card glass-card" style={{ marginTop: '1rem' }}>
                <div className="score-circle">
                    <span className="score-num">{result.score}</span>
                    <span className="total-num">/ {result.total_questions}</span>
                </div>
                <h2>Score: {result.percentage}%</h2>
                <p>Taken on {new Date(result.completed_at || '').toLocaleDateString()}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {result.quiz.topics.map((t, idx) => (
                        <span key={idx} className="topic-tag">{t}</span>
                    ))}
                </div>
            </div>

            <div className="review-section">
                <h3>Review Questions</h3>
                {result.quiz.questions.map((q, idx) => {
                    const userAns = result.answers.find(a => a.question_index === idx);
                    if (!userAns) return null;

                    return (
                        <div key={idx} className={`review-item ${userAns.is_correct ? 'correct' : 'wrong'}`}>
                            <p className="q-text">{idx + 1}. {q.question}</p>
                            <div className="options-review">
                                <p>Your Answer: <span className="val">{userAns.selected_option || 'None'}</span></p>
                                {!userAns.is_correct && <p>Correct Answer: <span className="val">{q.answer}</span></p>}
                            </div>
                            {q.explanation && <p className="explanation"><strong>Tip:</strong> {q.explanation}</p>}

                            {!userAns.is_correct && (
                                <div className="explain-action" style={{ marginTop: '0.75rem' }}>
                                    {aiExplanations[idx] ? (
                                        <div className="ai-explanation-box glass-card" style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                            <strong>🤖 AI Tutor says:</strong>
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                {aiExplanations[idx]}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                                            onClick={() => handleExplain(idx)}
                                            disabled={explainingId === idx}
                                        >
                                            {explainingId === idx ? '🤖 Thinking...' : '🤖 Explain This Error'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="header-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
                <button onClick={() => navigate('/profile')} className="btn-secondary">Return to Profile</button>
                <button 
                    className="btn-primary" 
                    onClick={() => navigate(`/plans/${result.quiz.study_plan}/quiz?topics=${encodeURIComponent(result.quiz.topics.join(','))}`)}
                >
                    Retake This Quiz
                </button>
            </div>
        </div>
    );
}
