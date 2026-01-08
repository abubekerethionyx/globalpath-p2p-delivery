import React, { useState, useEffect } from 'react';
import { NotificationService, Notification } from '../services/NotificationService';
import { User } from '../types';

interface NotificationsPageProps {
    user: User;
}

// Helper for relative time formatting
const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'UPDATES'>('ALL');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await NotificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'border-green-500/20 bg-green-500/10 text-green-500';
            case 'WARNING': return 'border-amber-500/20 bg-amber-500/10 text-amber-500';
            case 'MESSAGE': return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-500';
            case 'INFO': return 'border-blue-500/20 bg-blue-500/10 text-blue-500';
            default: return 'border-slate-500/20 bg-slate-500/10 text-slate-500';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'UNREAD') return !n.is_read;
        if (activeTab === 'UPDATES') return n.type === 'INFO' || n.type === 'WARNING';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 px-4 selection:bg-[#009E49]/10">
            <div className="max-w-3xl mx-auto">
                {/* Header Profile Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-8 bg-[#009E49]"></div>
                            <span className="text-[10px] font-black tracking-[0.3em] text-[#009E49] uppercase">Central Intelligence</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase">
                            Notifications
                        </h1>
                        <p className="text-slate-500 font-medium text-lg max-w-md leading-snug">
                            System activity, logistics updates, and direct transmissions synced to your ID.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4 text-[#009E49] group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Mark All Read</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] mb-8 shadow-sm animate-in fade-in duration-1000">
                    {(['ALL', 'UNREAD', 'UPDATES'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                } relative`}
                        >
                            {tab === 'UNREAD' && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009E49] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#009E49] items-center justify-center text-[8px] text-white">
                                        {unreadCount}
                                    </span>
                                </span>
                            )}
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Notifications Feed */}
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 w-full bg-white rounded-[2rem] border border-slate-100 animate-pulse"></div>
                        ))
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 border border-slate-100 text-center animate-in zoom-in-95 duration-500 shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-[#009E49]/20 mx-auto mb-8">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">CLEAN SLATE</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto">No pending transmissions in the {activeTab.toLowerCase()} registry.</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif, idx) => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                className={`group bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-300 transform cursor-pointer animate-in fade-in slide-in-from-right-4 
                                    ${!notif.is_read
                                        ? 'border-[#009E49]/20 shadow-xl shadow-green-500/5 hover:border-[#009E49]/40'
                                        : 'border-slate-100 shadow-sm opacity-80 hover:opacity-100 hover:shadow-md'
                                    }`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex items-start gap-6">
                                    <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl border flex items-center justify-center transition-transform group-hover:scale-110 ${getTypeStyles(notif.type)}`}>
                                        {notif.type === 'SUCCESS' && <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                                        {notif.type === 'MESSAGE' && <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                                        {notif.type === 'WARNING' && <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                        {notif.type === 'INFO' && <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`text-sm md:text-base font-black tracking-tight uppercase ${!notif.is_read ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#009E49]"></span>}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm md:text-base font-medium leading-relaxed mb-6 ${!notif.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {notif.link && (
                                                    <a
                                                        href={notif.link}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2
                                                            ${!notif.is_read
                                                                ? 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200'
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        Details <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    </a>
                                                )}
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                                                        className="text-[9px] font-black text-[#009E49] uppercase tracking-widest hover:underline px-2 py-1"
                                                    >
                                                        Dismiss
                                                    </button>
                                                )}
                                            </div>

                                            {notif.is_read && (
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Read Log</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
