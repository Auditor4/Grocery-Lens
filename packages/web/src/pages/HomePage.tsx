// ============================================================
// Home Page — Recent entries feed + quick stats
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

const CHANNELS: Record<string, string> = {
    'Zepto': '⚡', 'Blinkit': '🟡', 'Flipkart Minutes': '🔵', 'Offline': '🏪', 'Other': '📦',
};

export default function HomePage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [entriesRes, summaryRes] = await Promise.all([
            api.getEntries({ limit: '20' }),
            api.getAnalyticsSummary({}),
        ]);
        if (entriesRes.success && entriesRes.data) setEntries(entriesRes.data.entries);
        if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this entry?')) return;
        const res = await api.deleteEntry(id);
        if (res.success) {
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    }

    const filteredEntries = search
        ? entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
        : entries;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Hey, {user?.displayName || 'there'}! 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here's your grocery overview</p>
                </div>
                <Link to="/add" className="btn-primary flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                    Add Item
                </Link>
            </div>

            {/* Quick Stats */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="card p-4">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">This Month</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{summary.totalSpend?.toLocaleString()}</p>
                        {summary.percentChange !== 0 && (
                            <p className={`text-xs font-medium mt-1 ${summary.percentChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {summary.percentChange > 0 ? '↑' : '↓'} {Math.abs(summary.percentChange)}% vs last month
                            </p>
                        )}
                    </div>
                    <div className="card p-4">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Items</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.itemCount}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{summary.uniqueItems} unique</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg / Entry</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{summary.avgPerEntry?.toLocaleString()}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Month</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{summary.lastMonthSpend?.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    className="input-field"
                    placeholder="🔍 Search entries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Entries List */}
            <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Recent Entries
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-4 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="card p-8 text-center">
                        <p className="text-4xl mb-3">🛒</p>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No entries yet</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Start by adding your first grocery item!</p>
                        <Link to="/add" className="btn-primary inline-block mt-4 text-sm">Add Your First Item</Link>
                    </div>
                ) : (
                    filteredEntries.map((entry) => (
                        <div key={entry.id} className="card p-4 hover:shadow-md transition-shadow duration-200 group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="text-2xl flex-shrink-0">{entry.category?.icon || '📦'}</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{entry.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            {entry.quantity} {entry.unit} · {CHANNELS[entry.channel] || ''} {entry.channel} · {new Date(entry.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <p className="font-bold text-slate-900 dark:text-white">₹{entry.amount}</p>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="text-xs text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all mt-0.5"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
