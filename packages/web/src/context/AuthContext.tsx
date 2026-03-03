// ============================================================
// Auth Context — Manages the logged-in user state
// ============================================================
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    id: string;
    userId: string;
    displayName: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (userId: string, uid: string) => Promise<{ success: boolean; error?: string }>;
    register: (userId: string) => Promise<{ success: boolean; uid?: string; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in (on page load)
    useEffect(() => {
        refreshUser();
    }, []);

    async function refreshUser() {
        try {
            const res = await api.me();
            if (res.success && res.data) {
                setUser(res.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(userId: string, uid: string) {
        const res = await api.login(userId, uid);
        if (res.success && res.data) {
            await refreshUser();
            return { success: true };
        }
        return { success: false, error: res.error || 'Login failed.' };
    }

    async function register(userId: string) {
        const res = await api.register(userId);
        if (res.success && res.data) {
            await refreshUser();
            return { success: true, uid: res.data.uid };
        }
        return { success: false, error: res.error || 'Registration failed.' };
    }

    async function logout() {
        await api.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
