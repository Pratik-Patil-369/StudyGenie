import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="navbar">
            <Link to="/" className="logo">StudyGenie</Link>
            {user && (
                <nav className="nav-links">
                    <Link to="/" style={isActive('/') ? { color: 'var(--accent)', background: 'var(--accent-glow)' } : {}}>Home</Link>
                    <Link to="/new-plan" style={isActive('/new-plan') ? { color: 'var(--accent)', background: 'var(--accent-glow)' } : {}}>New Plan</Link>
                    <div className="nav-user">
                        <span>{user.full_name || user.email}</span>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </nav>
            )}
        </header>
    );
}
