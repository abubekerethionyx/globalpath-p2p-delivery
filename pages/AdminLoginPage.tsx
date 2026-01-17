
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { AuthService } from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

interface AdminLoginPageProps {
    onAuthComplete: (user: any) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAuthComplete }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [logs, setLogs] = useState<string[]>(['INITIALIZING SECURITY OVERRIDE...', 'READY FOR ACCESS CREDENTIALS.']);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        addLog(`INITIATING AUTHENTICATION FOR: ${email}`);

        try {
            addLog('SYNCHRONIZING WITH CORE PROTOCOL...');
            const response = await AuthService.login(email, password, UserRole.ADMIN);

            if (response.user && response.user.role === UserRole.ADMIN) {
                addLog('ACCESS GRANTED. REDIRECTING TO COMMAND CENTER...');
                showToast("Admin credentials verified.", 'SUCCESS');
                setTimeout(() => {
                    onAuthComplete(response.user);
                }, 1500);
            } else {
                throw new Error("PRIVILEGE ESCALATION DENIED: User is not an admin.");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || "AUTHENTICATION_FAILURE";
            addLog(`ERROR: ${errMsg.toUpperCase()}`);
            setError(errMsg);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-mono overflow-hidden relative">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-md w-full z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black">
                    {/* Terminal Header */}
                    <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Security Gateway v4.0</p>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <div className="flex items-center mb-2">
                                <div className="bg-emerald-500 w-2 h-6 mr-3"></div>
                                <h1 className="text-xl font-black text-white tracking-tighter">ADMIN_OVERRIDE</h1>
                            </div>
                            <p className="text-xs text-slate-500">Restricted access protocol. Unauthorized attempts are logged.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-6 text-[10px] font-bold uppercase tracking-wider">
                                Critical Failure: {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Identifier</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin.root@globalpath.et"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-emerald-500 focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Secret Key</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-emerald-500 focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading
                                        ? 'bg-slate-800 text-slate-500 cursor-wait'
                                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
                                    }`}
                            >
                                {isLoading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
                                Execute Login
                            </button>
                        </form>

                        {/* Console Output */}
                        <div className="mt-8 bg-black/40 rounded-2xl p-4 border border-white/5 h-32 overflow-y-auto custom-scrollbar">
                            {logs.map((log, i) => (
                                <p key={i} className="text-[9px] text-slate-500 mb-1 leading-relaxed">
                                    <span className="text-emerald-500/50 mr-2">{'>'}</span> {log}
                                </p>
                            ))}
                            <div ref={logEndRef}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em]">
                    GlobalPath P2P Logistics // Infrastructure Node
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
