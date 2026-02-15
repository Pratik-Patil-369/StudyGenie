import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
    onToggle: () => void;
}

export function LoginForm({ onToggle }: AuthFormProps) {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Login'}
            </button>
            <p className="toggle-text">
                Don't have an account? <span onClick={onToggle}>Register</span>
            </p>
        </form>
    );
}

export function RegisterForm({ onToggle }: AuthFormProps) {
    const { register, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await register(email, password, fullName);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        }
    };

    if (success) {
        return (
            <div className="auth-form">
                <h2>Success!</h2>
                <p>Account created. <span onClick={onToggle} className="link">Login now</span></p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Register</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Register'}
            </button>
            <p className="toggle-text">
                Already have an account? <span onClick={onToggle}>Login</span>
            </p>
        </form>
    );
}
