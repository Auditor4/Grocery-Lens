// ============================================================
// Add Item Page — Grocery entry form
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const UNITS = ['Kg', 'g', 'L', 'mL', 'pcs', 'dozen', 'pack'];
const CHANNELS = ['Zepto', 'Blinkit', 'Flipkart Minutes', 'Offline', 'Other'];
const CHANNEL_ICONS: Record<string, string> = {
    'Zepto': '⚡', 'Blinkit': '🟡', 'Flipkart Minutes': '🔵', 'Offline': '🏪', 'Other': '📦',
};

export default function AddItemPage() {
    const navigate = useNavigate();

    // Categories from API
    const [categories, setCategories] = useState<any[]>([]);

    // Form fields
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [categoryId, setCategoryId] = useState('');
    const [channel, setChannel] = useState('Zepto');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Autocomplete
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        api.getCategories().then(res => {
            if (res.success && res.data) {
                setCategories(res.data);
                if (res.data.length > 0) setCategoryId(res.data[0].id);
            }
        });
    }, []);

    // Autocomplete on name change
    useEffect(() => {
        if (name.length < 2) { setSuggestions([]); return; }
        const timer = setTimeout(async () => {
            const res = await api.autocomplete(name);
            if (res.success && res.data) {
                setSuggestions(res.data);
                setShowSuggestions(true);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [name]);

    function pickSuggestion(s: any) {
        setName(s.name);
        setQuantity(String(s.quantity));
        setUnit(s.unit);
        setChannel(s.channel);
        setCategoryId(s.categoryId);
        setAmount(String(s.lastAmount));
        setShowSuggestions(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await api.createEntry({
            name: name.trim(),
            amount: parseFloat(amount),
            quantity: parseFloat(quantity),
            unit,
            categoryId,
            channel,
            purchaseDate,
            notes: notes.trim() || undefined,
            scopeType: 'PERSONAL',
        });

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                setName(''); setAmount(''); setQuantity(''); setNotes('');
                setSuccess(false);
            }, 1500);
        } else {
            setError(res.error || 'Failed to save.');
        }
        setLoading(false);
    }

    return (
        <div className="animate-fade-in max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Add Grocery Item</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Log a purchase in seconds</p>

            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4 animate-slide-up text-center">
                    <p className="text-green-700 dark:text-green-400 font-semibold">✅ Item saved successfully!</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                {/* Item Name with Autocomplete */}
                <div className="relative">
                    <label className="label">Item Name *</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Milk, Tomatoes, Rice..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        required
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 card p-1 max-h-48 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm transition-colors"
                                    onClick={() => pickSuggestion(s)}
                                >
                                    <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                                    <span className="text-slate-400 dark:text-slate-500 ml-2">
                                        {s.quantity} {s.unit} · ₹{s.lastAmount} · {s.channel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Amount + Quantity */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Amount (₹) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-field"
                            placeholder="68.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Quantity *</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="input-field"
                            placeholder="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Unit */}
                <div>
                    <label className="label">Unit *</label>
                    <div className="flex flex-wrap gap-2">
                        {UNITS.map(u => (
                            <button
                                key={u}
                                type="button"
                                onClick={() => setUnit(u)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unit === u
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="label">Category *</label>
                    <select
                        className="input-field"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.icon} {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Channel */}
                <div>
                    <label className="label">Where did you buy? *</label>
                    <div className="flex flex-wrap gap-2">
                        {CHANNELS.map(ch => (
                            <button
                                key={ch}
                                type="button"
                                onClick={() => setChannel(ch)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${channel === ch
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {CHANNEL_ICONS[ch]} {ch}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="label">Purchase Date *</label>
                    <input
                        type="date"
                        className="input-field"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        required
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="label">Notes (optional)</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. organic, brand name, bulk buy"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <button type="submit" className="btn-primary w-full text-base" disabled={loading}>
                    {loading ? 'Saving...' : '💾 Save Entry'}
                </button>
            </form>
        </div>
    );
}
