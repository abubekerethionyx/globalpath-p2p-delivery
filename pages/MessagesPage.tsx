
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, MessageThread } from '../types';
import { useLocation } from 'react-router-dom';
import { MessageService } from '../services/MessageService';

interface MessagesPageProps {
  user: User;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const location = useLocation();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  // Get initialThreadId from navigation state
  const initialThreadId = (location.state as any)?.threadId;

  // Fetch threads for the current user
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const userThreads = await MessageService.getUserThreads();
        setThreads(userThreads);
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showListOnMobile, setShowListOnMobile] = useState(!initialThreadId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set active thread if not set and threads exist
  useEffect(() => {
    if (!activeThreadId && threads.length > 0 && !initialThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId, initialThreadId]);

  // Update active thread if navigation changes
  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
      setShowListOnMobile(false);
    }
  }, [initialThreadId]);

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      const fetchMessages = async () => {
        try {
          const msgs = await MessageService.getThreadMessages(activeThreadId);
          setMessages(msgs);
        } catch (e) {
          console.error("Failed to fetch messages", e);
        }
      };
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThreadId) return;
    try {
      await MessageService.sendMessage(activeThreadId, inputText);
      setInputText('');
      // Refresh messages immediately
      const msgs = await MessageService.getThreadMessages(activeThreadId);
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const getOtherParty = (thread: MessageThread): User => {
    // Current user is one of the participants. Return the other.
    if (thread.participant1?.id === user.id) {
      return thread.participant2;
    }
    return thread.participant1;
  };

  // Helper to group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(m => {
      const date = new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [messages]);


  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#009E49] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-in">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900">Inbox Empty</h2>
        <p className="text-slate-500 max-w-sm mt-3 font-medium">
          Start a conversation from a shipment to see messages here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex h-[80vh] animate-in">
      {/* Sidebar - Thread List */}
      <div className={`w-full md:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 ${!showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-100 bg-white">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Threads</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {threads.map(thread => {
            const otherParty = getOtherParty(thread);
            const isActive = thread.id === activeThreadId;

            return (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setShowListOnMobile(false);
                }}
                className={`w-full p-6 flex items-start text-left transition-all border-l-4 ${isActive
                  ? 'bg-white border-[#009E49] shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]'
                  : 'border-transparent hover:bg-slate-100/50'
                  }`}
              >
                <div className="relative shrink-0">
                  <img src={otherParty?.avatar} className="w-14 h-14 rounded-2xl border border-slate-200 shadow-sm" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`font-black truncate text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{otherParty?.firstName} {otherParty?.lastName}</p>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                      {thread.updated_at ? new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#009E49] uppercase tracking-tighter mb-1 truncate">
                    {thread.shipment ? `${thread.shipment.pickup_country} -> ${thread.shipment.dest_country}` : 'Direct Message'}
                  </p>
                  <p className="text-xs text-slate-400 truncate font-medium">
                    {thread.last_message || 'No messages yet...'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={`flex-1 flex flex-col bg-white ${showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center">
                <button
                  onClick={() => setShowListOnMobile(true)}
                  className="md:hidden mr-4 p-2 text-slate-400 hover:text-[#009E49] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative mr-4">
                  <img src={getOtherParty(activeThread)?.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-50" alt="" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">{getOtherParty(activeThread)?.firstName} {getOtherParty(activeThread)?.lastName}</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {activeThread.shipment?.status ? activeThread.shipment.status.replace('_', ' ') : 'Active'}
                    </p>
                  </div>
                </div>
              </div>

              {activeThread.shipment && (
                <div className="hidden lg:flex flex-col items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipment Context</p>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#009E49]/10 text-[#009E49] px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                      {activeThread.shipment.pickup_country} → {activeThread.shipment.dest_country}
                    </span>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Stream */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Begin safe communication</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="space-y-6">
                    <div className="flex justify-center">
                      <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                        {date}
                      </span>
                    </div>
                    {(msgs as any).map((msg, idx) => {
                      const isMe = msg.sender_id === user.id;
                      const showAvatar = !isMe;

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in`}>
                          {!isMe && (
                            <div className="mr-3 flex-shrink-0 self-end mb-1">
                              <img src={msg.sender?.avatar || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" alt="" />
                            </div>
                          )}
                          <div className={`max-w-[75%] md:max-w-[65%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3.5 shadow-sm text-sm leading-relaxed font-medium ${isMe
                              ? 'bg-[#009E49] text-white rounded-[1.5rem] rounded-tr-none'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-tl-none'
                              }`}>
                              {msg.text}
                            </div>
                            <div className={`mt-1.5 flex items-center gap-2 transition-opacity duration-300 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[9px] font-black text-slate-400 uppercase">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <svg className="w-3 h-3 text-[#009E49]" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Message Composer */}
            <div className="p-8 bg-white border-t border-slate-100">
              <div className="flex items-center gap-4">
                <button className="p-3 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message your delivery partner..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-4 text-sm font-bold focus:ring-4 focus:ring-[#009E49]/10 focus:bg-white focus:border-[#009E49] transition-all outline-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="bg-[#009E49] text-white p-4 rounded-[1.5rem] hover:bg-[#007A38] transition-all shadow-xl shadow-green-100 disabled:opacity-50 disabled:shadow-none active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/20">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h4 className="text-2xl font-black text-slate-900">Secure Channel</h4>
            <p className="text-sm max-w-xs mt-3 font-medium text-slate-500 leading-relaxed">Choose a conversation from the sidebar to communicate securely about your delivery items.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
