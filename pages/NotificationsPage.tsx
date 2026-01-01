import React, { useState, useEffect } from 'react';
import { NotificationService, Notification } from '../services/NotificationService';
import { User } from '../types';

interface NotificationsPageProps {
    user: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

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
            case 'SUCCESS': return 'bg-green-100 text-[#009E49]';
            case 'WARNING': return 'bg-amber-100 text-amber-600';
            case 'MESSAGE': return 'bg-indigo-100 text-indigo-600';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Communication Logs</h1>
                        <p className="text-slate-500 font-medium">Historical record of all system transmissions and protocol updates.</p>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-black text-[#009E49] uppercase tracking-widest hover:bg-green-50 px-4 py-2 rounded-xl transition-all border border-green-100"
                        >
                            Mark All as Read
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#009E49] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying History...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Registry Clear</h3>
                            <p className="text-slate-400 font-medium text-sm">No recorded transmissions found for your user identifier.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-8 flex items-start gap-6 transition-colors hover:bg-slate-50/50 relative ${!notif.is_read ? 'bg-green-50/20' : ''}`}
                                >
                                    {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#009E49]"></div>}

                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${getTypeStyles(notif.type)}`}>
                                        {notif.type === 'SUCCESS' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                                        {notif.type === 'MESSAGE' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                                        {notif.type === 'WARNING' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                        {notif.type === 'INFO' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{notif.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notif.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">{notif.message}</p>

                                        <div className="flex items-center gap-4">
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="text-[9px] font-black text-[#009E49] uppercase tracking-widest hover:underline"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            {notif.link && (
                                                <a
                                                    href={notif.link}
                                                    className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                                >
                                                    View Node <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
