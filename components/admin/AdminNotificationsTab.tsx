import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/AdminService';
import { UserRole } from '../../types';

interface UserBrief {
    id: string;
    name: string;
    email: string;
    role: string;
}

const AdminNotificationsTab: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('INFO');
    const [targetType, setTargetType] = useState<'ALL' | 'ROLE' | 'USERS' | 'LOCATION_HISTORY'>('ALL');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [location, setLocation] = useState('');
    const [users, setUsers] = useState<UserBrief[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [countries, setCountries] = useState<string[]>([]);

    useEffect(() => {
        if (targetType === 'USERS') {
            fetchUsers();
        }
        if (targetType === 'LOCATION_HISTORY' && countries.length === 0) {
            fetchCountries();
        }
    }, [targetType]);

    const fetchCountries = async () => {
        try {
            const data = await AdminService.getCountries();
            setCountries(data.filter(c => c.is_active).map(c => c.name));
        } catch (err) {
            console.error("Failed to fetch countries", err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!title || !message) {
            setFeedback({ type: 'error', text: 'Identity protocol requires Title and Message fields.' });
            return;
        }

        setSending(true);
        setFeedback(null);
        try {
            await AdminService.broadcastNotification({
                title,
                message,
                type,
                target_type: targetType,
                roles: targetType === 'ROLE' ? selectedRoles : undefined,
                user_ids: targetType === 'USERS' ? selectedUsers : undefined,
                location: targetType === 'LOCATION_HISTORY' ? location : undefined
            });
            setFeedback({ type: 'success', text: 'Broadcast synchronized across the global network.' });
            // Reset form
            setTitle('');
            setMessage('');
            setSelectedUsers([]);
            setSelectedRoles([]);
            setLocation('');
        } catch (err) {
            setFeedback({ type: 'error', text: 'Broadcast failure: Uplink interrupted.' });
        } finally {
            setSending(false);
        }
    };

    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white/50 backdrop-blur-md p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="max-w-3xl mx-auto space-y-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mass Communication</h2>
                        <p className="text-slate-500 font-medium italic">"Direct broadcast to platform nodes and clusters."</p>
                    </div>

                    {feedback && (
                        <div className={`p-6 rounded-2xl font-bold text-sm flex items-center animate-in zoom-in-95 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${feedback.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {feedback.type === 'success' ? '✓' : '!'}
                            </div>
                            {feedback.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Transmission Header</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., System Update 4.2"
                                    className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Signal Type</label>
                                <div className="flex space-x-2">
                                    {['INFO', 'SUCCESS', 'WARNING', 'MESSAGE'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Broadcast Payload</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter system announcement or localized celebration notification..."
                                className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all h-[155px] resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Targeting Parameters</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { id: 'ALL', label: 'Global (All)' },
                                    { id: 'ROLE', label: 'Cluster (Role)' },
                                    { id: 'USERS', label: 'Node (Direct)' },
                                    { id: 'LOCATION_HISTORY', label: 'Vector (Loc)' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTargetType(t.id as any)}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${targetType === t.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="animate-in slide-in-from-top-4 duration-500">
                            {targetType === 'ROLE' && (
                                <div className="flex flex-wrap gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    {[UserRole.SENDER, UserRole.PICKER].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => toggleRole(r)}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedRoles.includes(r) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {targetType === 'USERS' && (
                                <div className="space-y-4">
                                    <div className="max-h-60 overflow-y-auto p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {loading ? (
                                            <div className="col-span-full text-center py-4 text-slate-400 font-bold text-xs uppercase animate-pulse">Scanning global node registry...</div>
                                        ) : (
                                            users.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => toggleUser(u.id)}
                                                    className={`p-4 rounded-xl text-left border transition-all flex items-center group ${selectedUsers.includes(u.id) ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center font-black text-[10px] ${selectedUsers.includes(u.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-black uppercase tracking-tight ${selectedUsers.includes(u.id) ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                                                        <p className={`text-[10px] font-bold ${selectedUsers.includes(u.id) ? 'text-white/60' : 'text-slate-400'}`}>{u.email}</p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">{selectedUsers.length} Nodes Targeted</p>
                                </div>
                            )}

                            {targetType === 'LOCATION_HISTORY' && (
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Target Geography (Country)</label>
                                        <select
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-900"
                                        >
                                            <option value="">Select Target Country...</option>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 max-w-xs text-center flex-shrink-0">
                                        <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-widest">
                                            Platform will scan delivery manifests and notify all partners who have serviced this vector.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleBroadcast}
                        disabled={sending}
                        className="w-full relative group bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] overflow-hidden shadow-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-50"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {sending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Synchronizing Broadcast...
                                </>
                            ) : 'Initiate Mass Transmission'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#009E49]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </div>

            <div className="bg-indigo-900 p-12 rounded-[3.5rem] border border-indigo-800 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" /></svg>
                </div>
                <div className="relative z-10">
                    <h4 className="text-[#FDD100] font-black uppercase tracking-[0.3em] text-[10px] mb-4">Transmission Protocol Notes</h4>
                    <p className="text-indigo-100 text-lg font-medium leading-relaxed max-w-3xl">
                        Mass notifications are sent as high-priority signals. For localized celebration days, use the **Vector Targeting** to reach users with specific geographic history. Direct Node targeting is recommended for high-profile individual alerts.
                    </p>
                </div>
            </div>
        </div >
    );
};

export default AdminNotificationsTab;
