// ============================================================
// Groups Page — Create, manage, add members
// ============================================================
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [creating, setCreating] = useState(false);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [memberUid, setMemberUid] = useState('');
    const [addMsg, setAddMsg] = useState({ err: '', ok: '' });

    useEffect(() => { loadGroups(); }, []);

    async function loadGroups() {
        setLoading(true);
        const res = await api.getGroups();
        if (res.success && res.data) setGroups(res.data);
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault(); setCreating(true);
        const res = await api.createGroup(groupName.trim());
        if (res.success) { setShowCreate(false); setGroupName(''); loadGroups(); }
        setCreating(false);
    }

    async function handleAdd(gid: string) {
        setAddMsg({ err: '', ok: '' });
        const res = await api.addMember(gid, memberUid.trim());
        if (res.success && res.data) {
            setAddMsg({ err: '', ok: res.data.message || 'Added!' });
            setMemberUid(''); loadGroups();
        } else { setAddMsg({ err: res.error || 'Failed', ok: '' }); }
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groups</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Shared grocery tracking</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">+ Create Group</button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="card p-5 mb-6 animate-slide-up">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">New Group</h3>
                    <div className="flex gap-2">
                        <input type="text" className="input-field flex-1" placeholder='e.g. "Flat 302 Kitchen"' value={groupName} onChange={e => setGroupName(e.target.value)} required />
                        <button type="submit" className="btn-primary text-sm" disabled={creating}>{creating ? '...' : 'Create'}</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="card p-5 animate-pulse"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" /><div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2" /></div>
            ) : groups.length === 0 ? (
                <div className="card p-12 text-center">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No groups yet</p>
                    <p className="text-slate-400 text-sm mt-1">Create a group to track groceries together!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map(g => (
                        <div key={g.id} className="card p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{g.name}</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{g.groupCode}</p>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.myRole === 'ADMIN' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{g.myRole}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Members ({g.members?.length || 0})</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {g.members?.map((m: any) => (
                                    <div key={m.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-full px-3 py-1">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">{m.user?.displayName?.[0]?.toUpperCase() || '?'}</div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{m.user?.displayName}</span>
                                        {m.role === 'ADMIN' && <span className="text-[10px]">👑</span>}
                                        {g.myRole === 'ADMIN' && m.userId !== user?.id && (
                                            <button onClick={async () => { await api.removeMember(g.id, m.userId); loadGroups(); }} className="text-slate-400 hover:text-red-500 ml-1">✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {g.myRole === 'ADMIN' && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                                    {addingTo === g.id ? (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" className="input-field flex-1 text-sm font-mono" placeholder="Enter UID (e.g. GL-7X9K2M)" value={memberUid} onChange={e => setMemberUid(e.target.value)} />
                                                <button onClick={() => handleAdd(g.id)} className="btn-primary text-sm">Add</button>
                                                <button onClick={() => setAddingTo(null)} className="btn-secondary text-sm">Cancel</button>
                                            </div>
                                            {addMsg.err && <p className="text-sm text-red-500">{addMsg.err}</p>}
                                            {addMsg.ok && <p className="text-sm text-green-500">{addMsg.ok}</p>}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setAddingTo(g.id)} className="btn-secondary text-sm">+ Add Member</button>
                                            <button onClick={async () => { if (confirm('Delete group?')) { await api.deleteGroup(g.id); loadGroups(); } }} className="btn-danger text-sm">Delete</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
