import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'INFO') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 max-w-md w-full pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between p-6 rounded-[1.5rem] shadow-2xl border animate-in slide-in-from-right-10 fade-in duration-300 ${toast.type === 'SUCCESS' ? 'bg-white border-green-100 text-slate-900' :
                                toast.type === 'ERROR' ? 'bg-white border-red-100 text-slate-900' :
                                    toast.type === 'WARNING' ? 'bg-white border-amber-100 text-slate-900' :
                                        'bg-white border-slate-100 text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toast.type === 'SUCCESS' ? 'bg-green-50 text-[#009E49]' :
                                    toast.type === 'ERROR' ? 'bg-red-50 text-red-500' :
                                        toast.type === 'WARNING' ? 'bg-amber-50 text-amber-500' :
                                            'bg-slate-50 text-slate-500'
                                }`}>
                                {toast.type === 'SUCCESS' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                                {toast.type === 'ERROR' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>}
                                {toast.type === 'WARNING' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                {toast.type === 'INFO' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">{toast.type}</p>
                                <p className="text-xs font-medium text-slate-500">{toast.message}</p>
                            </div>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
