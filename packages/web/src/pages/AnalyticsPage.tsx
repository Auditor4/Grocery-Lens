// ============================================================
// Analytics Page — Dashboard with charts
// ============================================================
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function AnalyticsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [byCategory, setByCategory] = useState<any[]>([]);
    const [byChannel, setByChannel] = useState<any[]>([]);
    const [byItem, setByItem] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Date range
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        loadAnalytics();
    }, [startDate, endDate]);

    async function loadAnalytics() {
        setLoading(true);
        const params = { startDate, endDate };
        const [s, c, ch, it, tr] = await Promise.all([
            api.getAnalyticsSummary(params),
            api.getAnalyticsByCategory(params),
            api.getAnalyticsByChannel(params),
            api.getAnalyticsByItem(params),
            api.getAnalyticsTrends({ ...params, granularity: 'daily' }),
        ]);
        if (s.success) setSummary(s.data);
        if (c.success) setByCategory(c.data || []);
        if (ch.success) setByChannel(ch.data || []);
        if (it.success) setByItem(it.data || []);
        if (tr.success) setTrends(tr.data || []);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Analytics</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                            <div className="h-40 bg-slate-100 dark:bg-slate-700/50 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const isEmpty = !summary || summary.itemCount === 0;

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Your spending insights</p>
                </div>
                <div className="flex gap-2 items-center">
                    <input type="date" className="input-field text-sm !py-2 !w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-slate-400">→</span>
                    <input type="date" className="input-field text-sm !py-2 !w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {isEmpty ? (
                <div className="card p-12 text-center">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No data for this period</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add some grocery entries to see your analytics!</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="card p-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spend</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{summary.totalSpend?.toLocaleString()}</p>
                            {summary.percentChange !== 0 && (
                                <p className={`text-xs font-medium mt-1 ${summary.percentChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {summary.percentChange > 0 ? '↑' : '↓'} {Math.abs(summary.percentChange)}%
                                </p>
                            )}
                        </div>
                        <div className="card p-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Items</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.itemCount}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Unique Items</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.uniqueItems}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg / Entry</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{summary.avgPerEntry}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Category Pie */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Spend by Category</h3>
                            {byCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={byCategory}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={90}
                                            dataKey="totalSpend"
                                            nameKey="categoryName"
                                            stroke="none"
                                        >
                                            {byCategory.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Spend']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-sm text-slate-400 text-center py-8">No data</p>}
                        </div>

                        {/* Channel Bar */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Spend by Channel</h3>
                            {byChannel.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={byChannel}>
                                        <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Spend']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="totalSpend" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-sm text-slate-400 text-center py-8">No data</p>}
                        </div>
                    </div>

                    {/* Spend Trend */}
                    {trends.length > 0 && (
                        <div className="card p-5 mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Daily Spend Trend</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={trends}>
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Spend']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#22c55e"
                                        strokeWidth={2.5}
                                        dot={{ fill: '#22c55e', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Top Items Table */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Top Items by Spend</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">Item</th>
                                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">Total ₹</th>
                                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400 font-medium hidden sm:table-cell">Qty</th>
                                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400 font-medium hidden sm:table-cell">Avg ₹/unit</th>
                                        <th className="text-right py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">Buys</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {byItem.slice(0, 15).map((item, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                                            <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-white">₹{item.totalSpend}</td>
                                            <td className="py-2.5 px-2 text-right text-slate-500 dark:text-slate-400 hidden sm:table-cell">{item.totalQuantity} {item.unit}</td>
                                            <td className="py-2.5 px-2 text-right text-slate-500 dark:text-slate-400 hidden sm:table-cell">₹{item.avgUnitPrice}</td>
                                            <td className="py-2.5 px-2 text-right text-slate-500 dark:text-slate-400">{item.purchaseCount}×</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
