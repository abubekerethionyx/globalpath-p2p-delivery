
import React, { useState, useEffect, useRef } from 'react';
import { ShipmentItem, Message, User } from '../types';
import { api } from '../services/mockApiService';

interface ChatDrawerProps {
  item: ShipmentItem;
  currentUser: User;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ item, currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(api.getMessages(item.id));
    const interval = setInterval(() => {
      setMessages(api.getMessages(item.id));
    }, 2000);
    return () => clearInterval(interval);
  }, [item.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    api.sendMessage(item.id, currentUser.id, inputText);
    setInputText('');
    setMessages(api.getMessages(item.id));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[100] flex flex-col transform transition-all duration-500 border-l border-slate-100 animate-in">
      {/* Header */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#009E49] text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">{item.category}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {item.pickupCountry} → {item.destCountry}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 custom-scrollbar">
        <div className="flex flex-col items-center mb-10 opacity-40">
           <div className="bg-slate-200 h-px w-20 mb-4"></div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em]">Channel Encrypted</p>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-xs font-black uppercase tracking-widest">No previous history</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in`}>
                <div className={`max-w-[85%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3.5 shadow-sm text-sm font-medium ${
                    isMe 
                    ? 'bg-[#009E49] text-white rounded-2xl rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-8 bg-white border-t border-slate-50">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#009E49]/10 focus:bg-white outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-4 bg-[#009E49] text-white rounded-2xl hover:bg-[#007A38] transition shadow-xl shadow-green-100 active:scale-95 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
