// ============================================================
// Settings Page — Account, categories, export, theme
// ============================================================
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [categories, setCategories] = useState<any[]>([]);
    const [newCat, setNewCat] = useState('');
    const [newIcon, setNewIcon] = useState('📦');
    const isDark = (window as any).__isDarkMode;

    useEffect(() => { loadCats(); }, []);

    async function loadCats() {
        const res = await api.getCategories();
        if (res.success && res.data) setCategories(res.data);
    }

    async function addCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!newCat.trim()) return;
        await api.createCategory({ name: newCat.trim(), icon: newIcon });
        setNewCat(''); setNewIcon('📦'); loadCats();
    }

    async function handleDelete() {
        if (!confirm('Are you sure? This will permanently delete your account and all personal data. This CANNOT be undone.')) return;
        if (!confirm('FINAL WARNING: Type "delete" to confirm... (Click OK if you understand)')) return;
        await api.deleteAccount();
        await logout();
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Manage your account and preferences</p>

            {/* Account Info */}
            <div className="card p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Account</h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {user?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">{user?.displayName}</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">User ID: {user?.userId}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                    </div>
                </div>
                <button onClick={logout} className="btn-secondary text-sm mr-2">Log Out</button>
            </div>

            {/* Theme */}
            <div className="card p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Appearance</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-slate-400">Toggle between light and dark theme</p>
                    </div>
                    <button
                        onClick={() => (window as any).__toggleDarkMode?.()}
                        className={`w-12 h-7 rounded-full relative transition-colors ${isDark ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="card p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Categories</h3>
                <div className="space-y-2 mb-4">
                    {categories.map(c => (
                        <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <span className="text-sm">
                                <span className="mr-2">{c.icon}</span>
                                <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                                {c.isDefault && <span className="text-[10px] ml-2 text-slate-400">(default)</span>}
                            </span>
                            {!c.isDefault && (
                                <button onClick={async () => { await api.deleteCategory(c.id); loadCats(); }} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                            )}
                        </div>
                    ))}
                </div>
                <form onSubmit={addCategory} className="flex gap-2">
                    <input type="text" maxLength={4} className="input-field w-16 text-center text-xl" value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="📦" />
                    <input type="text" className="input-field flex-1" placeholder="New category name" value={newCat} onChange={e => setNewCat(e.target.value)} required />
                    <button type="submit" className="btn-primary text-sm">Add</button>
                </form>
            </div>

            {/* Export */}
            <div className="card p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Export Data</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">Download your grocery data as a CSV file</p>
                <button onClick={() => api.exportCsv({})} className="btn-secondary text-sm">📥 Export CSV</button>
            </div>

            {/* Danger Zone */}
            <div className="card p-5 border-red-200 dark:border-red-800">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">Danger Zone</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
                <button onClick={handleDelete} className="btn-danger text-sm">🗑️ Delete Account</button>
            </div>
        </div>
    );
}
