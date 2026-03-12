import { useState, useEffect } from 'react';
import { apiGet } from '../utils/api';
import './Leaderboard.css';

interface LeaderboardUser {
    _id: string;
    full_name: string;
    email: string;
    xp: number;
    currentStreak: number;
}

export const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await apiGet('/users/leaderboard');
                setUsers(data);
            } catch (err: any) {
                console.error('Failed to load leaderboard', err);
                setError('Could not load leaderboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    if (loading) return <div className="leaderboard-card skeleton">Loading Leaderboard...</div>;
    if (error) return null; // Don't crash the homepage, just hide it
    if (users.length === 0) return null;

    return (
        <div className="leaderboard-card">
            <h3 className="leaderboard-title">🏆 Top Learners</h3>
            <div className="leaderboard-list">
                {users.map((user, index) => (
                    <div key={user._id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                        <div className="rank">
                            {getMedal(index)}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.full_name || user.email.split('@')[0]}</span>
                            {user.currentStreak > 0 && (
                                <span className="user-streak" title={`${user.currentStreak} day streak`}>
                                    🔥 {user.currentStreak}
                                </span>
                            )}
                        </div>
                        <div className="user-xp">
                            <span className="xp-value">{user.xp}</span>
                            <span className="xp-label">XP</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
