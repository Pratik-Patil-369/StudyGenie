import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm, RegisterForm } from '../components/AuthForms';

export default function LoginPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    if (user) {
        navigate('/');
        return null;
    }

    return (
        <div className="auth-page">
            <div className="auth-brand">
                <div className="logo-large"> StudyGenie</div>
                <p>Your AI-powered smart study companion</p>
            </div>
            {isLogin ? (
                <LoginForm onToggle={() => setIsLogin(false)} />
            ) : (
                <RegisterForm onToggle={() => setIsLogin(true)} />
            )}
        </div>
    );
}
