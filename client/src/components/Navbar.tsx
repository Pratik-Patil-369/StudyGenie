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

    // Checks exact match for Home, prefix match for nested routes
    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header className="navbar">
            <Link to="/" className="logo">StudyGenie</Link>
            {user && (
                <nav className="nav-links">
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
                    >
                        Home
                        {isActive('/') && <span className="nav-active-dot" />}
                    </Link>
                    <Link
                        to="/new-plan"
                        className={`nav-link ${isActive('/new-plan') ? 'nav-link-active' : ''}`}
                    >
                        New Plan
                        {isActive('/new-plan') && <span className="nav-active-dot" />}
                    </Link>
                    <div className="nav-user">
                        <span className="nav-username">{user.full_name || user.email}</span>
                        <button className="btn-logout" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>
            )}
        </header>
    );
}
