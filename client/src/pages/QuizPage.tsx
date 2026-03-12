import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { toast } from '../components/Toast';
import { usePageTitle } from '../hooks/usePageTitle';

interface Question {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface QuizData {
    quizId: string;
    questions: Question[];
    difficulty: string;
    topics?: string[];
    dayLabel?: string;
}

export default function QuizPage() {
    const { id: planId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dayParam = searchParams.get('day'); // present when coming from DailyPlanPage

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ question_index: number; selected_option: string }[]>([]);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState('');
    const [aiExplanations, setAiExplanations] = useState<{ [key: number]: string }>({});
    const [explainingId, setExplainingId] = useState<number | null>(null);

    const quizLabel = quiz?.dayLabel || (dayParam ? `Day ${dayParam} Quiz` : 'Adaptive Quiz');
    usePageTitle(results ? 'Quiz Results' : quizLabel);

    useEffect(() => {
        // If navigated from DailyPlanPage with day-wise data, use sessionStorage
        const cachedKey = `quiz_${planId}`;
        const cached = sessionStorage.getItem(cachedKey);
        if (cached && dayParam) {
            try {
                const parsed = JSON.parse(cached);
                setQuiz(parsed);
                sessionStorage.removeItem(cachedKey); // use once
                setLoading(false);
                return;
            } catch { /* fall through to generate */ }
        }
        generateQuiz();
    }, [planId]);

    const generateQuiz = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiPost(`/quizzes/${planId}/generate-quiz`, {});
            setQuiz(data);
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz. Make sure you have completed topics!');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (!selectedOption || !quiz) return;

        const newAnswers = [...answers, { question_index: currentStep, selected_option: selectedOption }];
        setAnswers(newAnswers);

        if (currentStep < quiz.questions.length - 1) {
            setCurrentStep(currentStep + 1);
            setSelectedOption(null);
        } else {
            submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers: typeof answers) => {
        setLoading(true);
        try {
            const data = await apiPost(`/quizzes/submit-quiz/${quiz?.quizId}`, { answers: finalAnswers });
            setResults(data);
            // Show toast if topics were auto-marked
            if (data.autoMarkedTopics && data.autoMarkedTopics.length > 0) {
                toast(`🎯 ${data.autoMarkedTopics.length} topic(s) auto-marked as done! (Score ≥ 80%)`, 'success');
            }
        } catch (err) {
            toast('Failed to submit results. Please try again.', 'error');
            setError('Failed to submit results');
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (q: Question, idx: number, userAnsOptions: string) => {
        setExplainingId(idx);
        try {
            const data = await apiPost('/quizzes/explain', {
                question: q.question,
                options: q.options,
                correctAnswer: q.answer,
                userAnswer: userAnsOptions,
                topic: quiz?.topics ? quiz.topics[0] : 'General'
            });
            setAiExplanations(prev => ({ ...prev, [idx]: data.explanation }));
        } catch (err) {
            toast('Failed to get AI explanation', 'error');
        } finally {
            setExplainingId(null);
        }
    };

    if (loading) return (
        <div className="page-loader">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">AI is crafting your quiz...</p>
        </div>
    );
    if (error) return (
        <div className="daily-plan-page">
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h2>Quiz Unavailable</h2>
                <p>{error}</p>
                <button
                    onClick={() => navigate(`/plans/${planId}/topics`)}
                    className="btn-primary"
                    style={{ marginTop: '2rem' }}
                >← Back to Topics</button>
            </div>
        </div>
    );

    if (results) {
        return (
            <div className="daily-plan-page">
                <div className="page-header">
                    <h1>Quiz Results</h1>
                    <div className={`difficulty-badge difficulty-${quiz?.difficulty}`}>{quiz?.difficulty}</div>
                </div>

                <div className="results-card glass-card">
                    <div className="score-circle">
                        <span className="score-num">{results.score}</span>
                        <span className="total-num">/ {results.total}</span>
                    </div>
                    <h2>{results.percentage >= 80 ? 'Excellent Work!' : results.percentage >= 50 ? 'Good Progress!' : 'Keep Studying!'}</h2>
                    <p>You scored {results.percentage}% on this {quizLabel.toLowerCase()}.</p>
                    {dayParam && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>📧 A results summary has been sent to your email.</p>}
                </div>

                <div className="review-section">
                    <h3>Review Questions</h3>
                    {quiz?.questions.map((q, idx) => {
                        const userAns = results.review.find((r: any) => r.question_index === idx);
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
                                                onClick={() => handleExplain(q, idx, userAns.selected_option)}
                                                disabled={explainingId === idx}
                                            >
                                                {explainingId === idx ? '🤖 Thinking...' : '🤖 Explain This'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="header-actions" style={{ justifyContent: 'center', marginTop: '3rem' }}>
                    <button onClick={() => navigate(`/plans/${planId}/topics`)} className="btn-secondary">Back to Topics</button>
                    <button onClick={() => navigate(`/plans/${planId}/daily-plan`)} className="btn-secondary">Daily Plan</button>
                    <button onClick={() => window.location.reload()} className="btn-primary">Try Another Quiz</button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz?.questions[currentStep];

    return (
        <div className="daily-plan-page quiz-page">
            <div className="page-header">
                <div>
                    <h1>{quizLabel}</h1>
                    <p className="subtitle">Step {currentStep + 1} of {quiz?.questions.length}</p>
                </div>
                <div className={`difficulty-badge difficulty-${quiz?.difficulty}`}>{quiz?.difficulty} Mode</div>
            </div>

            <div className="quiz-progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((currentStep + 1) / (quiz?.questions.length || 1)) * 100}%` }}
                ></div>
            </div>

            <div className="question-card glass-card">
                <h2 className="question-text">{currentQuestion?.question}</h2>
                <div className="options-grid">
                    {currentQuestion?.options.map((opt, idx) => (
                        <button
                            key={idx}
                            className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                            onClick={() => setSelectedOption(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="quiz-actions">
                <button
                    className="btn-primary btn-large"
                    disabled={!selectedOption}
                    onClick={handleNext}
                >
                    {currentStep === (quiz?.questions.length || 0) - 1 ? 'Finish Quiz' : 'Next Question'}
                </button>
            </div>
        </div>
    );
}
