import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };


    return (
        <header className="navbar">
            <Link to="/" className="logo">StudyGenie</Link>
            {user && (
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>Home</NavLink>
                    <NavLink to="/new-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>New Plan</NavLink>
                    <div className="user-menu">
                        {user.currentStreak !== undefined && user.currentStreak > 0 && (
                            <span className="streak-badge" title={`${user.currentStreak} day study streak!`}>
                                🔥 {user.currentStreak}
                            </span>
                        )}
                        <Link to="/profile" className="user-name" style={{ textDecoration: 'none' }}>
                            {user.full_name || user.email.split('@')[0]}
                        </Link>
                        <button onClick={handleLogout} className="btn-secondary logout-btn">Logout</button>
                    </div>
                </div>
            )}
        </header>
    );
}
