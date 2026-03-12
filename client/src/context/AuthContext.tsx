import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../config';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    currentStreak?: number;
    xp?: number;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Module-level cache — survives re-renders, reset on logout
let cachedUser: { id: string; email: string; full_name: string | null } | null = null;
let hasFetched = false;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(cachedUser);
    const [isLoading, setIsLoading] = useState(!hasFetched);

    useEffect(() => {
        if (hasFetched) return; // Skip network call if already fetched this session
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                credentials: 'include',
            });
            if (res.ok) {
                const u = await res.json();
                cachedUser = u;
                hasFetched = true;
                setUser(u);
            } else {
                cachedUser = null;
                hasFetched = true;
                setUser(null);
            }
        } catch {
            cachedUser = null;
            hasFetched = true;
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            setIsLoading(false);
            throw new Error((await res.json()).detail || 'Login failed');
        }
        const data = await res.json();
        setUser(data.user);
        setIsLoading(false);
    };

    const register = async (email: string, password: string, fullName: string) => {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
        setIsLoading(false);
        if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    };

    const logout = async () => {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        cachedUser = null;
        hasFetched = false;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
