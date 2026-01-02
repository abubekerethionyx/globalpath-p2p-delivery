import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="bg-[#009E49] p-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors mb-8 group"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-5xl font-black tracking-tight mb-4">Privacy Agreement</h1>
                        <p className="text-green-50 font-medium">Securing your data across the African continent.</p>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                </div>

                {/* Content Section */}
                <div className="p-12 space-y-12">
                    <div className="bg-green-50/50 rounded-3xl p-8 border border-green-100/50">
                        <h3 className="text-[#009E49] font-black uppercase tracking-[0.2em] text-xs mb-3">Commitment to Privacy</h3>
                        <p className="text-slate-700 font-medium leading-relaxed">
                            At GlobalPath, we recognize that your personal data is an asset. We are committed to maintaining the highest level of security and transparency in how we collect, use, and protect your information within the Ethiopian legal framework.
                        </p>
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#009E49]/10 rounded-xl flex items-center justify-center text-[#009E49]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Data We Collect</h2>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "Basic Identity", desc: "Name, email, and phone number provided during registration." },
                                { title: "Location Data", desc: "GPS coordinates to facilitate delivery and pickup services." },
                                { title: "Device Info", desc: "IP address and OS version for security node monitoring." },
                                { title: "Transaction Nodes", desc: "Subscription history and payment ledger entries." }
                            ].map((item, i) => (
                                <li key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-[#009E49]/30 transition-colors group">
                                    <h4 className="font-black text-slate-900 mb-1 group-hover:text-[#009E49] transition-colors">{item.title}</h4>
                                    <p className="text-xs text-slate-500 font-bold">{item.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#009E49]/10 rounded-xl flex items-center justify-center text-[#009E49]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Usage Protocol</h2>
                        </div>
                        <div className="space-y-4 prose prose-slate text-slate-600 font-medium leading-relaxed">
                            <p>
                                Your information is used primary to optimize the P2P logistics chain. This includes route calculation, sender-picker matching, and automated subscription status verification.
                            </p>
                            <div className="bg-slate-900 rounded-2xl p-6 text-white text-sm shadow-xl mt-8">
                                <div className="flex items-center mb-4">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                    <span className="font-black uppercase tracking-widest text-[10px]">Security Notice</span>
                                </div>
                                <p className="opacity-80 leading-relaxed font-bold italic">
                                    "We never sell your personal data to third-party advertising networks. Your privacy is our platform's foundational protocol."
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#009E49]/10 rounded-xl flex items-center justify-center text-[#009E49]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Your Legal Rights</h2>
                        </div>
                        <p className="text-slate-600 font-medium">
                            Under Ethiopian data protection regulations, you have the right to access, rectify, or erase your personal information. You can manage these preferences within your account settings or by contacting our Data Protection Officer.
                        </p>
                    </section>
                </div>

                {/* Footer Section */}
                <div className="bg-slate-50 p-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
                    <div className="flex items-center space-x-6">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">DPO Contact</p>
                            <p className="text-sm font-black text-slate-900">privacy@globalpath.et</p>
                        </div>
                        <div className="w-[1px] h-10 bg-slate-200 hidden md:block"></div>
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</p>
                            <p className="text-sm font-black text-green-600">Compliant (GDPR/ET)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
