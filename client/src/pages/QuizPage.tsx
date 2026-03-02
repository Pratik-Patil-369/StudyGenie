import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
}

export default function QuizPage() {
    const { id: planId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ question_index: number; selected_option: string }[]>([]);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState('');
    usePageTitle(results ? 'Quiz Results' : 'Adaptive Quiz');

    useEffect(() => {
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
        } catch (err) {
            toast('Failed to submit results. Please try again.', 'error');
            setError('Failed to submit results');
        } finally {
            setLoading(false);
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
                    <p>You scored {results.percentage}% on this adaptive quiz.</p>
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
                            </div>
                        );
                    })}
                </div>

                <div className="header-actions" style={{ justifyContent: 'center', marginTop: '3rem' }}>
                    <button onClick={() => navigate(`/plans/${planId}/topics`)} className="btn-secondary">Back to Topics</button>
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
                    <h1>AI Adaptive Quiz</h1>
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
