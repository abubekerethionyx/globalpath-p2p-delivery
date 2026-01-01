import React, { useState, useEffect } from 'react';
import { SupportService } from '../../services/SupportService';
import { SupportTicket, TicketStatus, TicketPriority } from '../../types';

const AdminSupportTab: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await SupportService.getTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (ticket: SupportTicket) => {
        setLoading(true);
        try {
            const fullTicket = await SupportService.getTicket(ticket.id);
            setSelectedTicket(fullTicket);
        } catch (error) {
            alert('Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;
        setIsSubmitting(true);
        try {
            const reply = await SupportService.addReply(selectedTicket.id, replyMessage);
            setSelectedTicket({
                ...selectedTicket,
                replies: [...(selectedTicket.replies || []), reply],
                status: TicketStatus.PENDING
            });
            setReplyMessage('');
            fetchTickets(); // Refresh list to show status change
        } catch (error) {
            alert('Failed to send reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (status: TicketStatus) => {
        if (!selectedTicket) return;
        try {
            await SupportService.updateStatus(selectedTicket.id, status);
            setSelectedTicket({ ...selectedTicket, status });
            fetchTickets();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusStyle = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.OPEN: return 'bg-green-100 text-[#009E49]';
            case TicketStatus.PENDING: return 'bg-amber-100 text-amber-600';
            case TicketStatus.RESOLVED: return 'bg-slate-100 text-slate-500';
            case TicketStatus.CLOSED: return 'bg-red-100 text-red-600';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* Ticket List */}
            <div className="col-span-4 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Support Queue</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading && tickets.length === 0 ? (
                        <div className="flex items-center justify-center h-20">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : tickets.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => handleSelectTicket(ticket)}
                            className={`w-full text-left p-5 rounded-2xl transition-all border-2 ${selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyle(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">
                                    {ticket.id.split('-')[0]}
                                </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1 mb-1">{ticket.subject}</h4>
                            <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{ticket.user_name}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket Workspace */}
            <div className="col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{selectedTicket.category} Protocol</p>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedTicket.subject}</h2>
                                <p className="text-xs font-medium text-slate-400 mt-2">Opened by <span className="text-slate-900 font-black">{selectedTicket.user_name}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (!selectedTicket) return;
                                        const analysisMsg = `[SENTINEL-ANALYSIS]: Diagnostic sequence complete for Category: ${selectedTicket.category}. \n- Thread Health: Optimized\n- Identity Verification: High-Density Confirmed\n- Recommended Protocol: Proceed with standard ${selectedTicket.priority} escalation.`;
                                        setIsSubmitting(true);
                                        try {
                                            const reply = await SupportService.addReply(selectedTicket.id, analysisMsg);
                                            setSelectedTicket({
                                                ...selectedTicket,
                                                replies: [...(selectedTicket.replies || []), reply]
                                            });
                                        } catch (e) { alert('Analysis failed'); }
                                        finally { setIsSubmitting(false); }
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Run Sentinel Analysis
                                </button>
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                                    className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none"
                                >
                                    {Object.values(TicketStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* User Initial Post */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                    {selectedTicket.user_name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-slate-50 p-6 rounded-2xl rounded-tl-none">
                                        <p className="text-sm text-slate-600 leading-relaxed">{selectedTicket.description}</p>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 mt-2 ml-2 uppercase tracking-widest">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Thread */}
                            {selectedTicket.replies?.map(reply => (
                                <div key={reply.id} className={`flex gap-4 ${reply.user_role === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${reply.user_role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                        {reply.user_role === 'ADMIN' ? 'SP' : reply.user_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className={`flex-1 ${reply.user_role === 'ADMIN' ? 'text-right' : ''}`}>
                                        <div className={`p-6 rounded-2xl ${reply.user_role === 'ADMIN' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-600 rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{reply.message}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{new Date(reply.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex gap-4">
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Transmit response to partner..."
                                    className="flex-1 p-5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all text-sm font-medium h-20 resize-none"
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={isSubmitting || !replyMessage.trim()}
                                    className="px-8 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Sending...' : 'Respond'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Intelligence Ready</h3>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Select a transmission for interception</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportTab;
