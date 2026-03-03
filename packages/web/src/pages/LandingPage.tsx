// ============================================================
// Landing Page — Login + Sign Up
// ============================================================
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const { login, register } = useAuth();

    // Form state
    const [userId, setUserId] = useState('');
    const [uid, setUid] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // After registration — show UID
    const [showUid, setShowUid] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(userId.trim(), uid.trim());
        if (!res.success) setError(res.error || 'Login failed.');
        setLoading(false);
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await register(userId.trim());
        if (res.success && res.uid) {
            setShowUid(res.uid);
        } else {
            setError(res.error || 'Registration failed.');
        }
        setLoading(false);
    }

    function copyUid() {
        navigator.clipboard.writeText(showUid);
    }

    // UID Confirmation Screen
    if (showUid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created! 🎉</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Save these credentials. You need both to log in.</p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 mb-6 space-y-3 text-left">
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">User ID</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{userId}</p>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your UID (Secret Key)</p>
                                <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">{showUid}</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠️ Write this down! If you lose your UID, you cannot recover your account.</p>
                        </div>

                        <button onClick={copyUid} className="btn-secondary w-full mb-3">
                            📋 Copy UID to Clipboard
                        </button>
                        <button onClick={() => setShowUid('')} className="btn-primary w-full">
                            Continue to Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mx-auto mb-4 animate-pulse-green">
                        G
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">GroceryLens</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track your groceries smartly 🛒</p>
                </div>

                {/* Card */}
                <div className="card p-6 sm:p-8">
                    {/* Tab Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Login Form */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="label">User ID</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. mayank_42"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">UID (Secret Key)</label>
                                <input
                                    type="text"
                                    className="input-field font-mono"
                                    placeholder="e.g. GL-7X9K2M"
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}
                            <button type="submit" className="btn-primary w-full" disabled={loading}>
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>
                    )}

                    {/* Register Form */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="label">Choose a User ID</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. mayank_42"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    required
                                    minLength={4}
                                    maxLength={20}
                                    pattern="[a-zA-Z0-9_]+"
                                    title="Letters, numbers, and underscores only"
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">4-20 characters. Letters, numbers, underscores.</p>
                            </div>
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}
                            <button type="submit" className="btn-primary w-full" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                                No email or password needed. We'll generate a secret key for you.
                            </p>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
                    GroceryLens v1.0 — Your personal grocery tracker
                </p>
            </div>
        </div>
    );
}
