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
    const [searchQuery, setSearchQuery] = useState('');
    const [showPreview, setShowPreview] = useState(false);

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
            setFeedback({ type: 'error', text: 'Title and Message are required fields.' });
            return;
        }

        // Additional validation based on target type
        if (targetType === 'ROLE' && selectedRoles.length === 0) {
            setFeedback({ type: 'error', text: 'Please select at least one role.' });
            return;
        }

        if (targetType === 'USERS' && selectedUsers.length === 0) {
            setFeedback({ type: 'error', text: 'Please select at least one user.' });
            return;
        }

        if (targetType === 'LOCATION_HISTORY' && !location) {
            setFeedback({ type: 'error', text: 'Please select a target country.' });
            return;
        }

        setSending(true);
        setFeedback(null);
        try {
            const response: any = await AdminService.broadcastNotification({
                title,
                message,
                type,
                target_type: targetType,
                roles: targetType === 'ROLE' ? selectedRoles : undefined,
                user_ids: targetType === 'USERS' ? selectedUsers : undefined,
                location: targetType === 'LOCATION_HISTORY' ? location : undefined
            });
            setFeedback({ type: 'success', text: response.message || 'Notification sent successfully!' });
            // Reset form
            setTitle('');
            setMessage('');
            setSelectedUsers([]);
            setSelectedRoles([]);
            setLocation('');
            setShowPreview(false);
        } catch (err: any) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to send notification. Please try again.' });
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

    const selectAllUsers = () => {
        const filtered = getFilteredUsers();
        setSelectedUsers(filtered.map(u => u.id));
    };

    const deselectAllUsers = () => {
        setSelectedUsers([]);
    };

    const getFilteredUsers = () => {
        if (!searchQuery) return users;
        return users.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const getTargetSummary = () => {
        switch (targetType) {
            case 'ALL':
                return 'All platform users';
            case 'ROLE':
                return selectedRoles.length === 0 ? 'No roles selected' : `${selectedRoles.join(', ')}`;
            case 'USERS':
                return selectedUsers.length === 0 ? 'No users selected' : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`;
            case 'LOCATION_HISTORY':
                return location || 'No location selected';
            default:
                return '';
        }
    };

    const notificationTypeConfig = {
        'INFO': { color: 'blue', icon: '🔵', label: 'Information' },
        'SUCCESS': { color: 'green', icon: '✅', label: 'Success' },
        'WARNING': { color: 'amber', icon: '⚠️', label: 'Warning' },
        'MESSAGE': { color: 'purple', icon: '💬', label: 'Message' }
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#009E49]/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FDD100]/10 blur-[80px] rounded-full"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#009E49] flex items-center justify-center shadow-lg shadow-[#009E49]/20">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight">Broadcast Center</h2>
                            <p className="text-slate-400 font-medium mt-1">Send notifications to users across the platform</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Messages */}
            {feedback && (
                <div className={`p-6 rounded-2xl font-bold text-sm flex items-center gap-4 animate-in zoom-in-95 shadow-lg ${feedback.type === 'success'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${feedback.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {feedback.type === 'success' ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>
                    <div className="flex-1">{feedback.text}</div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Main Form */}
            <div className="bg-white/50 backdrop-blur-md p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                <div className="space-y-8">
                    {/* Notification Content */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-[#009E49]"></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Message Content</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Title Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
                                    Notification Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Platform Update v2.0"
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all"
                                />
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
                                    Notification Type *
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(notificationTypeConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setType(key)}
                                            className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${type === key
                                                ? 'bg-slate-900 text-white shadow-lg transform scale-105'
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                        >
                                            <span className="text-lg">{config.icon}</span>
                                            <span className="hidden md:block">{config.label}</span>
                                            <span className="md:hidden">{key}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Message Textarea */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
                                    Message Content *
                                </label>
                                <span className="text-[10px] font-bold text-slate-400">{message.length} characters</span>
                            </div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your notification message here..."
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all min-h-[120px] resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Target Audience</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: 'ALL', label: 'Everyone', icon: '🌍', desc: 'All users' },
                                { id: 'ROLE', label: 'By Role', icon: '👥', desc: 'Specific roles' },
                                { id: 'USERS', label: 'Specific Users', icon: '👤', desc: 'Individual users' },
                                { id: 'LOCATION_HISTORY', label: 'By Location', icon: '📍', desc: 'Geographic filter' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTargetType(t.id as any)}
                                    className={`p-4 rounded-2xl text-left transition-all border-2 group hover:-translate-y-1 ${targetType === t.id
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                                        : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300 shadow-sm'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{t.icon}</div>
                                    <p className={`text-xs font-black uppercase tracking-tight ${targetType === t.id ? 'text-white' : 'text-slate-900'
                                        }`}>{t.label}</p>
                                    <p className={`text-[10px] font-medium mt-1 ${targetType === t.id ? 'text-white/70' : 'text-slate-400'
                                        }`}>{t.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Target-specific options */}
                        <div className="animate-in slide-in-from-top-4 duration-500">
                            {targetType === 'ROLE' && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border-2 border-indigo-100">
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-4">Select Roles:</p>
                                    <div className="flex flex-wrap gap-3">
                                        {[UserRole.SENDER, UserRole.PICKER].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => toggleRole(r)}
                                                className={`px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider border-2 transition-all transform hover:-translate-y-1 ${selectedRoles.includes(r)
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                                                    : 'bg-white text-slate-700 border-indigo-200 hover:border-indigo-400 shadow-sm'
                                                    }`}
                                            >
                                                {r === UserRole.SENDER ? '📦' : '🚚'} {r}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-indigo-600 mt-4">
                                        {selectedRoles.length === 0 ? 'No roles selected' : `${selectedRoles.length} role(s) selected`}
                                    </p>
                                </div>
                            )}

                            {targetType === 'USERS' && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-3xl border-2 border-blue-100 space-y-4">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Select Users:</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search users..."
                                                className="px-4 py-2 rounded-xl text-xs font-bold border-2 border-blue-100 focus:border-blue-400 outline-none bg-white/80 backdrop-blur-sm"
                                            />
                                            <button
                                                onClick={selectAllUsers}
                                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={deselectAllUsers}
                                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-blue-100 p-4">
                                        {loading ? (
                                            <div className="text-center py-12">
                                                <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                                <p className="text-slate-400 font-bold text-xs uppercase">Loading users...</p>
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                                </div>
                                                <p className="text-slate-400 font-bold text-sm">No users found</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {filteredUsers.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => toggleUser(u.id)}
                                                        className={`p-4 rounded-xl text-left border-2 transition-all flex items-center gap-3 group hover:-translate-y-0.5 ${selectedUsers.includes(u.id)
                                                            ? 'bg-blue-600 border-blue-600 shadow-lg'
                                                            : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${selectedUsers.includes(u.id)
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'
                                                            }`}>
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-black uppercase tracking-tight truncate ${selectedUsers.includes(u.id) ? 'text-white' : 'text-slate-900'
                                                                }`}>{u.name}</p>
                                                            <p className={`text-[10px] font-medium truncate ${selectedUsers.includes(u.id) ? 'text-white/70' : 'text-slate-400'
                                                                }`}>{u.email}</p>
                                                        </div>
                                                        {selectedUsers.includes(u.id) && (
                                                            <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-blue-600">
                                        {selectedUsers.length === 0 ? 'No users selected' : `${selectedUsers.length} user(s) selected`}
                                    </p>
                                </div>
                            )}

                            {targetType === 'LOCATION_HISTORY' && (
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-3xl border-2 border-emerald-100">
                                    <div className="flex flex-col lg:flex-row items-start gap-6">
                                        <div className="flex-1 w-full space-y-2">
                                            <label className="text-xs font-black text-emerald-900 uppercase tracking-wider">Target Country:</label>
                                            <select
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-white border-2 border-emerald-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all text-slate-900"
                                            >
                                                <option value="">Select a country...</option>
                                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-200 max-w-xs">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                                                    This will notify all users who have delivery history in the selected country.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview & Actions */}
                    <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                        {/* Preview Toggle */}
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border-2 border-slate-100"
                        >
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
                            </span>
                            <svg className={`w-5 h-5 text-slate-400 transition-transform ${showPreview ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {/* Preview Card */}
                        {showPreview && (
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-3xl border-2 border-slate-200 animate-in slide-in-from-top-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">Preview:</p>
                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-lg max-w-md">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'INFO' ? 'bg-blue-100 text-blue-600' :
                                            type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                                                type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-purple-100 text-purple-600'
                                            }`}>
                                            {notificationTypeConfig[type as keyof typeof notificationTypeConfig]?.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-sm text-slate-900 mb-1">{title || 'Notification Title'}</p>
                                            <p className="text-xs text-slate-600 font-medium">{message || 'Notification message will appear here...'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-2">To: {getTargetSummary()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={handleBroadcast}
                            disabled={sending}
                            className="w-full relative group bg-gradient-to-r from-slate-900 to-slate-800 text-white py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] overflow-hidden shadow-2xl hover:from-black hover:to-slate-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {sending ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending Notification...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        Send Notification
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#009E49]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Panel */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-10 rounded-[3rem] border border-indigo-700 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" /></svg>
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#FDD100]"></div>
                        <h4 className="text-[#FDD100] font-black uppercase tracking-[0.3em] text-xs">Best Practices</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
                            <p className="text-white font-bold text-sm mb-2">📢 Broadcasting Tips</p>
                            <ul className="text-indigo-200 text-xs font-medium space-y-1.5 leading-relaxed">
                                <li>• Keep titles concise and descriptive</li>
                                <li>• Use appropriate notification types</li>
                                <li>• Test with a small group first</li>
                            </ul>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
                            <p className="text-white font-bold text-sm mb-2">🎯 Targeting Guide</p>
                            <ul className="text-indigo-200 text-xs font-medium space-y-1.5 leading-relaxed">
                                <li>• Use role-based for feature updates</li>
                                <li>• Use location for regional events</li>
                                <li>• Use direct for individual alerts</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationsTab;
