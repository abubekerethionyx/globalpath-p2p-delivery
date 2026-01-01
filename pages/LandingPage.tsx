
import React from 'react';
import { MOCK_USERS } from '../constants';

interface LandingPageProps {
    onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-white selection:bg-[#009E49]/30">
            {/* Animated Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#009E49]/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FDD100]/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-4 pb-20 lg:pt-8 lg:pb-40 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Left: Content */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center p-1.5 pr-5 rounded-full bg-slate-50 border border-slate-100 shadow-sm group cursor-pointer hover:border-[#009E49]/30 transition-all">
                            <span className="px-3 py-1 rounded-full bg-[#009E49] text-white text-[10px] font-black uppercase tracking-widest mr-3 shadow-lg shadow-green-200">Live</span>
                            <span className="text-[11px] font-bold text-slate-600">Protocol v2.0: Now with 48h Escrow Protection</span>
                            <svg className="w-3 h-3 ml-2 text-[#009E49] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                                The Global <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009E49] to-emerald-600 relative inline-block">
                                    Traveler
                                    <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#FDD100] opacity-40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
                                </span> <br />
                                Network.
                            </h1>
                            <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                                Join 25,000+ users shipping from Addis to Dubai, London, and China. Connect with verified travelers to get anything delivered anywhere—fast, safe, and cost-effective.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <button
                                onClick={() => onNavigate('login')}
                                className="w-full sm:w-auto bg-slate-900 text-white pl-8 pr-3 py-2 rounded-full text-lg font-black hover:bg-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all flex items-center justify-between group"
                            >
                                <span className="mr-8 uppercase tracking-widest text-sm">Initiate Shipment</span>
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#009E49] transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </button>
                            <button
                                onClick={() => onNavigate('packaging')}
                                className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5 text-[#FDD100]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Partner with Us
                            </button>
                        </div>

                        <div className="pt-8 flex flex-wrap items-center gap-10 border-t border-slate-100">
                            <div className="space-y-3">
                                <div className="flex -space-x-4">
                                    {MOCK_USERS.slice(0, 5).map((u, i) => (
                                        <img key={u.id} src={u.avatar} className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl hover:scale-110 hover:z-10 transition-transform cursor-pointer" style={{ zIndex: 5 - i }} alt="" />
                                    ))}
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black border-4 border-white shadow-xl">+5k</div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active nodes in 45 countries</p>
                            </div>
                            <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
                            <div>
                                <div className="flex items-center text-[#FDD100] gap-0.5 mb-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">5.0 Customer Rating</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Modern Visual */}
                    <div className="lg:col-span-5 relative hidden lg:block h-[600px] z-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-slate-50 rounded-[4rem] -rotate-6 border border-slate-100 -z-10"></div>

                        <div className="relative h-full flex items-center justify-center">
                            {/* Card 1: Live Status */}
                            <div className="absolute top-10 -left-12 w-64 bg-white p-5 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-bounce-slow z-20">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-[#009E49]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-[9px] font-black text-[#009E49] uppercase tracking-widest">In Transit</span>
                                </div>
                                <p className="text-xs font-black text-slate-900 mb-1">Shanghai → Addis</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ETA: 14 Hours</p>
                            </div>

                            {/* Card 2: Main Interface Mockup */}
                            <div className="w-[320px] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-slate-50 overflow-hidden relative z-10 group hover:scale-[1.02] transition-transform duration-500">
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Shipment</p>
                                        <h3 className="text-2xl font-black text-slate-900 leading-none">iPhone 15 Pro <br /> Max Box</h3>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Weight</p>
                                            <p className="text-xs font-black text-slate-900 font-mono">0.45 KG</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Reward</p>
                                            <p className="text-xs font-black text-[#009E49] font-mono">2,400 ETB</p>
                                        </div>
                                    </div>

                                    <button className="w-full bg-[#009E49] py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100">
                                        Claim Assignment
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Earnings */}
                            <div className="absolute bottom-10 -right-12 w-60 bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-slate-700 animate-float z-20">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Traveler Earnings</p>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <p className="text-2xl font-black text-white">12,500</p>
                                    <p className="text-[10px] font-black text-[#FDD100]">ETB +</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FDD100] w-[80%] rounded-full shadow-[0_0_10px_#FDD100]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Trust Ticker */}
            <div className="bg-slate-900 py-12 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center lg:justify-between items-center gap-12 relative z-10">
                    <div className="text-center lg:text-left">
                        <p className="text-3xl font-black text-white leading-none">25K+</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Protocol Users</p>
                    </div>
                    <div className="hidden lg:block w-px h-12 bg-white/10"></div>
                    <div className="text-center lg:text-left">
                        <p className="text-3xl font-black text-white leading-none">12.4M</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">ETB Distributed</p>
                    </div>
                    <div className="hidden lg:block w-px h-12 bg-white/10"></div>
                    <div className="text-center lg:text-left">
                        <p className="text-3xl font-black text-white leading-none">48h</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Average Delivery</p>
                    </div>
                    <div className="hidden lg:block w-px h-12 bg-white/10"></div>
                    <div className="text-center lg:text-left">
                        <p className="text-3xl font-black text-white leading-none">100%</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Identity Verified</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-full bg-[#009E49] opacity-10 blur-[80px]"></div>
            </div>

            {/* How it Works */}
            <section className="py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-20">
                    <p className="text-[#009E49] text-[10px] font-black uppercase tracking-[0.4em]">The Protocol</p>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">How it Works</h2>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto">Ship anything, anywhere, by connecting directly with travelers heading to your destination.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            step: "01",
                            title: "List Shipment",
                            desc: "Post your item, destination, and the reward fee you're offering for delivery.",
                            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        },
                        {
                            step: "02",
                            title: "Match Traveler",
                            desc: "A verified traveler heading that way claims your shipment and passes identity checks.",
                            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        },
                        {
                            step: "03",
                            title: "Safe Delivery",
                            desc: "Item is delivered, handed over, and payment is released from escrow securely.",
                            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        }
                    ].map((item, i) => (
                        <div key={i} className="group p-10 rounded-[3rem] bg-white border border-slate-100 hover:border-[#009E49]/30 transition-all hover:shadow-2xl hover:shadow-green-50 relative">
                            <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">{item.step}</div>
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl group-hover:bg-[#009E49] transition-colors relative z-10">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 lg:p-24 text-center space-y-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#009E49] opacity-20 blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FDD100] opacity-10 blur-[120px]"></div>

                    <div className="space-y-6 relative z-10">
                        <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">Ready to join the <br /> <span className="text-[#009E49]">New Standard?</span></h2>
                        <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto">Create your account today and start shipping or earning immediately on Ethiopia's largest P2P network.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
                        <button
                            onClick={() => onNavigate('login')}
                            className="w-full sm:w-auto bg-[#009E49] text-white px-12 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-900/50 hover:bg-[#007A38] transition-all hover:-translate-y-1"
                        >
                            Get Started Now
                        </button>
                        <button
                            onClick={() => onNavigate('login')}
                            className="w-full sm:w-auto text-white font-black uppercase text-xs tracking-[0.2em] hover:text-[#009E49] transition-colors"
                        >
                            Speak with Support
                        </button>
                    </div>
                </div>
            </section>

            {/* Hero Background Image - Shipment Bag */}
            <div className="absolute top-1/2 -right-40 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none z-0 hidden lg:block select-none">
                <img
                    src="https://img.freepik.com/premium-photo/shopping-bag-minimal-style_198067-10103.jpg"
                    alt="Shipment Bag"
                    className="w-full h-full object-contain opacity-40 mix-blend-multiply"
                />
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(10px, -10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
