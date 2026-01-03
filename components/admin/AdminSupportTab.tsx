
import React, { useState, useEffect, useCallback } from 'react';
import { SupportService } from '../../services/SupportService';
import { SupportTicket, TicketStatus } from '../../types';
import { debounce } from 'lodash';

const AdminSupportTab: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination & Filter State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTickets = async (page: number, status: string, category: string, search: string) => {
        setLoading(true);
        try {
            const response = await SupportService.getTickets({
                page,
                per_page: 20, // Keep in sync limit
                status: status === 'ALL' ? undefined : status,
                category: category === 'ALL' ? undefined : category,
                search
            });
            setTickets(response.tickets);
            setTotalPages(response.pages);
            setCurrentPage(response.current_page);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced fetch for search
    const debouncedFetch = useCallback(
        debounce((page, status, category, search) => {
            fetchTickets(page, status, category, search);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedFetch(currentPage, filterStatus, filterCategory, searchTerm);
    }, [currentPage, filterStatus, filterCategory, searchTerm, debouncedFetch]);

    const handleSelectTicket = async (ticket: SupportTicket) => {
        // Optimistic selection or fetch full details if needed
        // Assuming list returns enough or we fetch full details now:
        try {
            const fullTicket = await SupportService.getTicket(ticket.id);
            setSelectedTicket(fullTicket);
        } catch (error) {
            alert('Failed to load ticket details');
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
            // Optional: refresh list to update status in sidebar
            fetchTickets(currentPage, filterStatus, filterCategory, searchTerm);
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
            fetchTickets(currentPage, filterStatus, filterCategory, searchTerm);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusStyle = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.OPEN: return 'bg-green-100 text-[#009E49] border-green-200';
            case TicketStatus.PENDING: return 'bg-amber-100 text-amber-600 border-amber-200';
            case TicketStatus.RESOLVED: return 'bg-blue-50 text-blue-600 border-blue-100';
            case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
            {/* Sidebar: Filters & List */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-xl">
                {/* Filters */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tickets or users..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-shadow"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="flex-1 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest py-2 px-2 rounded-lg outline-none focus:border-indigo-600"
                        >
                            <option value="ALL">All Status</option>
                            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="flex-1 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest py-2 px-2 rounded-lg outline-none focus:border-indigo-600"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="GENERAL">General</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="PAYMENT">Payment</option>
                            <option value="SHIPMENT">Shipment</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading && tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest"> syncing...</span>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active tickets</p>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => handleSelectTicket(ticket)}
                                className={`w-full text-left p-4 rounded-xl transition-all border ${selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-300 font-mono">
                                        #{ticket.id.split('-')[0]}
                                    </span>
                                </div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1 mb-1">{ticket.subject}</h4>
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{ticket.user_name}</p>
                                    <p className="text-[8px] font-mono text-slate-300">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                </div>
                            </button>
                        )))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 transition"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 transition"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content: Ticket Details */}
            <div className="col-span-12 md:col-span-8 bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-xl">
                {selectedTicket ? (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-md uppercase tracking-widest">{selectedTicket.priority} Priority</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedTicket.category} Protocol</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-snug">{selectedTicket.subject}</h2>
                                <p className="text-xs font-medium text-slate-400 mt-1">Initiated by <span className="text-slate-900 font-bold">{selectedTicket.user_name}</span></p>
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
                                <div className="relative">
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                                        className="pl-4 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                                    >
                                        {Object.values(TicketStatus).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <svg className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                            {/* User Initial Post */}
                            <div className="relative group">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200 shrink-0">
                                        {selectedTicket.user_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white p-6 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm">
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedTicket.description}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-300 mt-2 ml-2 uppercase tracking-widest">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 -z-10 group-last:hidden"></div>
                            </div>

                            {/* Thread */}
                            {selectedTicket.replies?.map((reply, idx) => (
                                <div key={reply.id} className={`flex gap-4 ${reply.user_role === 'ADMIN' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 fade-in duration-500`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-lg ${reply.user_role === 'ADMIN' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-900 shadow-slate-100'}`}>
                                        {reply.user_role === 'ADMIN' ? 'SP' : reply.user_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className={`flex-1 ${reply.user_role === 'ADMIN' ? 'text-right' : ''}`}>
                                        <div className={`p-6 rounded-[1.5rem] shadow-sm inline-block text-left max-w-[90%] ${reply.user_role === 'ADMIN'
                                                ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none'
                                                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-300 mt-2 mx-2 uppercase tracking-widest">{new Date(reply.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Transmit secure response protocol..."
                                        className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium h-24 resize-none placeholder:text-slate-400"
                                    />
                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSendReply}
                                    disabled={isSubmitting || !replyMessage.trim()}
                                    className="h-24 px-8 flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-slate-200"
                                >
                                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{isSubmitting ? 'Sending...' : 'Transmit'}</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-200 mb-6 shadow-xl shadow-slate-100 animate-pulse">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Support Operations Center</h3>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2 max-w-xs">Select an incoming transmission stream to initialize response protocols</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportTab;
