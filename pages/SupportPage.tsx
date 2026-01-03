import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SupportService } from '../services/SupportService';
import { SupportTicket, TicketStatus, TicketPriority, User } from '../types';
import { useNavigate } from 'react-router-dom';

interface SupportPageProps {
    user: User;
}

const SupportPage: React.FC<SupportPageProps> = ({ user }) => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    // New Ticket Form
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [priority, setPriority] = useState('MEDIUM');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await SupportService.getTickets();
            setTickets(data.tickets);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await SupportService.createTicket(subject, description, category, priority);
            setIsCreateModalOpen(false);
            setSubject('');
            setDescription('');
            fetchTickets();
        } catch (error) {
            alert('Failed to create ticket');
        } finally {
            setIsSubmitting(false);
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
        setIsReplying(true);
        try {
            const reply = await SupportService.addReply(selectedTicket.id, replyMessage);
            setSelectedTicket({
                ...selectedTicket,
                replies: [...(selectedTicket.replies || []), reply]
            });
            setReplyMessage('');
        } catch (error) {
            alert('Failed to send reply');
        } finally {
            setIsReplying(false);
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
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50/50">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Support Registry</h1>
                            <p className="text-slate-500 font-medium">Connect with our protocol specialists and resolve system issues.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                        >
                            Initiate Ticket
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Ticket List */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 h-[600px] overflow-y-auto">
                                {loading && tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#009E49] rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Querying Feed...</p>
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                        </div>
                                        <p className="text-slate-900 font-black text-lg mb-1">Zero Transmissions</p>
                                        <p className="text-slate-400 text-xs font-medium uppercase tracking-tight">No support tickets found on your account.</p>
                                    </div>
                                ) : (
                                    tickets.map(ticket => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => handleSelectTicket(ticket)}
                                            className={`w-full text-left p-6 rounded-[2rem] transition-all mb-3 group border-2 ${selectedTicket?.id === ticket.id ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedTicket?.id === ticket.id ? 'bg-white/10 text-white' : getStatusStyle(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedTicket?.id === ticket.id ? 'text-white/40' : 'text-slate-400'}`}>
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className={`font-black text-sm mb-2 uppercase tracking-tight line-clamp-1 ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${ticket.priority === TicketPriority.URGENT ? 'bg-red-500' : ticket.priority === TicketPriority.HIGH ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedTicket?.id === ticket.id ? 'text-white/40' : 'text-slate-500'}`}>{ticket.priority} Priority</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="lg:col-span-7">
                            {selectedTicket ? (
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[600px]">
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID:</span>
                                                <span className="text-[10px] font-black text-[#009E49] font-mono">{selectedTicket.id.split('-')[0].toUpperCase()}</span>
                                            </div>
                                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedTicket.subject}</h2>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest block mb-2 ${getStatusStyle(selectedTicket.status)}`}>
                                                {selectedTicket.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                                        {/* Original Message */}
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black">YU</div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">You</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none text-slate-600 text-sm font-medium leading-relaxed">
                                                    {selectedTicket.description}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Replies */}
                                        {selectedTicket.replies?.map(reply => (
                                            <div key={reply.id} className={`flex gap-4 ${reply.user_role === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${reply.user_role === 'ADMIN' ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-900'}`}>
                                                    {reply.user_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className={`flex-1 space-y-2 ${reply.user_role === 'ADMIN' ? 'text-right' : ''}`}>
                                                    <div className={`flex items-baseline gap-3 ${reply.user_role === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                                            {reply.user_role === 'ADMIN' ? 'Support Protocol' : 'You'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(reply.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className={`p-6 rounded-[2rem] text-sm font-medium leading-relaxed ${reply.user_role === 'ADMIN' ? 'bg-[#009E49]/5 text-slate-700 rounded-tr-none' : 'bg-slate-50 text-slate-600 rounded-tl-none'}`}>
                                                        {reply.message}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 border-t border-slate-50 bg-slate-50/50 rounded-b-[2.5rem]">
                                        <div className="flex gap-4">
                                            <textarea
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                placeholder="Transmit instructions or feedback..."
                                                className="flex-1 p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] transition-all text-sm font-medium outline-none resize-none h-16"
                                            />
                                            <button
                                                onClick={handleSendReply}
                                                disabled={isReplying || !replyMessage.trim()}
                                                className="bg-slate-900 text-white w-16 h-16 rounded-2xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100 h-[600px] flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-8 blur-[0.5px]">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Protocol Ready</h3>
                                    <p className="text-slate-500 font-medium max-w-sm mb-8">Select a transmission from the registry to view logs and engage with system support.</p>
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                        <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Support Initiation</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Specify operational conflict details</p>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateTicket} className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject</label>
                                    <input
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief system conflict title..."
                                        className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all font-black text-xs uppercase"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all font-black text-xs uppercase"
                                        >
                                            <option value="TECHNICAL">Technical</option>
                                            <option value="PAYMENT">Payment</option>
                                            <option value="SHIPMENT">Shipment</option>
                                            <option value="GENERAL">General</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Description</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Explain the conflict in high density..."
                                        className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#009E49]/10 focus:border-[#009E49] outline-none transition-all font-medium text-slate-600 h-32 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#009E49] py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-green-100 hover:bg-[#007A38] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Transmitting...' : 'Initiate Protocol'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default SupportPage;
