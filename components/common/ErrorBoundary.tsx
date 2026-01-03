
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-50/50 rounded-3xl border border-slate-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">System Error</h2>
                    <p className="text-slate-500 text-sm font-medium max-w-md mb-6">
                        An unexpected error occurred in this component. Our protocols have logged this event.
                    </p>
                    <details className="text-left text-[10px] bg-slate-900 text-slate-400 p-4 rounded-xl font-mono overflow-auto max-w-full">
                        <summary className="cursor-pointer mb-2 font-bold text-slate-200">Error Details</summary>
                        {this.state.error?.toString()}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                    >
                        Reload Protocol
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
