import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors mb-8 group"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-5xl font-black tracking-tight mb-4">Terms of Service</h1>
                        <p className="text-slate-400 font-medium">Last Updated: January 2, 2026</p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009E49]/10 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FDD100]/5 blur-[80px] rounded-full"></div>
                </div>

                {/* Content Section */}
                <div className="p-12 space-y-12">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-sm">01</span>
                            Contractual Relationship
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                These Terms of Use ("Terms") govern the access or use by you, an individual, from within any country in the world of applications, websites, content, products, and services (the "Services") made available by GlobalPath Ethiopia.
                            </p>
                            <p className="mt-4">
                                PLEASE READ THESE TERMS CAREFULLY BEFORE ACCESSING OR USING THE SERVICES.
                                In these Terms, the words "including" and "include" mean "including, but not limited to."
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-sm">02</span>
                            The Services
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                The Services constitute a technology platform that enables users of GlobalPath's mobile applications or websites provided as part of the Services (each, an "Application") to arrange and schedule peer-to-peer delivery services with third party providers of such services.
                            </p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Notice of Agent Status</p>
                                <p className="text-sm">
                                    YOU ACKNOWLEDGE THAT GLOBALPATH DOES NOT PROVIDE DELIVERY SERVICES OR FUNCTION AS A CARRIER AND THAT ALL SUCH DELIVERY SERVICES ARE PROVIDED BY INDEPENDENT THIRD PARTY CONTRACTORS WHO ARE NOT EMPLOYED BY GLOBALPATH.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-sm">03</span>
                            User Accounts
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                In order to use most aspects of the Services, you must register for and maintain an active personal user Services account ("Account"). You must be at least 18 years of age to obtain an Account.
                            </p>
                            <p className="mt-4">
                                Account registration requires you to submit certain personal information, such as your name, address, mobile phone number and age, as well as at least one valid payment method.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-sm">04</span>
                            Payment & Subscriptions
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                Use of the Services may result in charges to you for the services or goods you receive from a Third Party Provider. All charges should be paid through the GlobalPath platform using approved payment methods.
                            </p>
                            <p className="mt-4">
                                If you subscribe to a premium plan, you agree to the recurring charges associated with that plan. You can cancel your subscription at any time through the billing dashboard.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-sm">05</span>
                            Termination
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>
                                GlobalPath may immediately terminate these Terms or any Services with respect to you, or generally cease offering or deny access to the Services or any portion thereof, at any time for any reason.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer Section */}
                <div className="bg-slate-50 p-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 text-center md:text-left">
                    <div>
                        <p className="text-slate-900 font-black uppercase tracking-widest text-xs mb-2">GlobalPath Legal Representative</p>
                        <p className="text-slate-500 text-sm font-medium">Addis Ababa, Ethiopia · support@globalpath.et</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        Accept & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
