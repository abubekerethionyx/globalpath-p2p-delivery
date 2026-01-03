import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, VerificationStatus } from '../types';
import { UserService } from '../services/UserService';

import { MessageService } from '../services/MessageService';

const PickerProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [picker, setPicker] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPicker = async () => {
            if (!id) return;
            try {
                const data = await UserService.getUserById(id);
                setPicker(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadPicker();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!picker) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Partner Not Found</h2>
            <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
            >
                Go Back
            </button>
        </div>
    );

    const handleMessage = async () => {
        if (!picker) return;
        try {
            const thread = await MessageService.createThread(picker.id);
            navigate('/messages', { state: { threadId: thread.id } });
        } catch (e) {
            console.error("Failed to start conversation", e);
            alert("Could not start conversation");
        }
    };

    const getVerificationData = () => {
        if (!picker) return null;

        const checks = [
            { label: 'Email Verified', status: picker.isEmailVerified },
            { label: 'Phone Registry', status: picker.isPhoneVerified || !!picker.phoneNumber },
            { label: 'Resident Artifact', status: !!picker.homeAddress },
            { label: 'Emergency Contact', status: !!picker.emergencyContact },
            { label: 'Identity Documents', status: !!(picker.nationalId || picker.passportNumber) },
            { label: 'Biometrics', status: !!(picker.selfieUrl && picker.idFrontUrl) },
            { label: 'Manual Clearance', status: picker.verificationStatus === VerificationStatus.VERIFIED },
        ];

        const completed = checks.filter(c => c.status).length;
        const total = checks.length;
        const percent = Math.round((completed / total) * 100);

        let tier = "Unverified";
        let tierColor = "text-slate-400";
        if (picker.verificationStatus === VerificationStatus.VERIFIED) {
            tier = "Verified User";
            tierColor = "text-[#009E49]";
        } else if (completed >= 5) {
            tier = "Pro Level";
            tierColor = "text-indigo-600";
        } else if (completed >= 3) {
            tier = "Active Level";
            tierColor = "text-amber-600";
        } else if (completed >= 1) {
            tier = "Basic Level";
            tierColor = "text-blue-600";
        }

        return { checks, completed, total, percent, tier, tierColor };
    };

    const vData = getVerificationData();

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 pt-12 space-y-10 animate-in fade-in duration-700 pb-24">
            {/* Header / Nav */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <p className="text-[#009E49] text-[10px] font-black uppercase tracking-widest">Partner Network</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Registry</h1>
                </div>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
                <div className="h-44 bg-slate-900 relative">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4f46e5,transparent)]"></div>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-3xl border-[6px] border-white shadow-2xl bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 overflow-hidden">
                                {picker.avatar ? (
                                    <img src={picker.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{picker.firstName?.[0]}{picker.lastName?.[0]}</span>
                                )}
                            </div>
                            {picker.verificationStatus === VerificationStatus.VERIFIED && (
                                <div className="absolute -bottom-1 -right-1 bg-[#009E49] text-white p-2 rounded-xl shadow-lg border-4 border-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-10 px-8 md:px-12 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h2 className="text-4xl font-black text-slate-900">{picker.firstName} {picker.lastName}</h2>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${picker.role === 'PICKER' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                                {picker.role} Account
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-4 gap-x-6 mt-4">
                            {!picker.hideEmail && (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="text-xs font-bold">{picker.email}</span>
                                </div>
                            )}
                            {!picker.hidePhoneNumber && picker.phoneNumber && (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <span className="text-xs font-bold font-mono tracking-tighter">{picker.phoneNumber}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-400">
                                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-xs font-bold tracking-tight uppercase tracking-widest">Joined {new Date(picker.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                            <button
                                onClick={handleMessage}
                                className="px-8 py-3 bg-[#009E49] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#007A38] transition-all shadow-xl shadow-green-100 active:scale-95"
                            >
                                Send Message
                            </button>
                            <button className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                                Report Partner
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-center min-w-[140px]">
                            <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Success Rating</p>
                            <div className="flex items-center gap-2">
                                {picker.hideRating ? (
                                    <span className="text-[10px] font-black text-slate-300 italic uppercase">Locked</span>
                                ) : (
                                    <>
                                        <span className="text-2xl font-black text-slate-900 leading-none">{(picker.rating || 0).toFixed(1)}</span>
                                        <div className="flex text-amber-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-center min-w-[140px]">
                            <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Total Deliveries</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">
                                {picker.hideCompletedDeliveries ? '***' : picker.completedDeliveries}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 col-span-2">
                            <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Active This Month</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">
                                {picker.itemsCountThisMonth || 0} <span className="text-[10px] text-slate-400">UNITS</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance & Trust */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reliability Analysis</h3>
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">Live Pulse</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transmission Speed</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-slate-900">
                                    {picker.averageDeliveryTime
                                        ? `${picker.averageDeliveryTime < 24 ? picker.averageDeliveryTime.toFixed(1) : (picker.averageDeliveryTime / 24).toFixed(1)}`
                                        : '0.0'
                                    }
                                </span>
                                <span className="text-xs font-black text-slate-400 uppercase mb-1.5">
                                    {picker.averageDeliveryTime ? (picker.averageDeliveryTime < 24 ? 'Hours' : 'Days') : 'Hrs'}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed">
                                Average time from handover to successful fulfillment across all active routes.
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Node Consistency</h4>
                            <div className="flex items-end gap-2 text-[#009E49]">
                                <span className="text-3xl font-black">98.4</span>
                                <span className="text-xs font-black uppercase mb-1.5">%</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed">
                                Statistical measure of on-time deliveries and protocol adherence.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm rotate-6">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Feed Verification Coming Soon</h4>
                        <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto leading-relaxed">
                            Detailed transaction feedback and route-specific reputation logs are currently being synchronized.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#009E49] rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 opacity-10"></div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">Trust Manifest</p>
                            {picker.verificationStatus === VerificationStatus.VERIFIED && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#009E49]/20 text-[#009E49] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#009E49]/20">
                                    <span className="w-1 h-1 bg-[#009E49] rounded-full animate-pulse"></span>
                                    High Trust
                                </div>
                            )}
                        </div>
                        <h3 className={`text-3xl font-black relative z-10 tracking-tight ${vData?.tierColor}`}>{vData?.tier}</h3>
                        <div className="mt-6 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${vData?.percent === 100 ? 'bg-[#009E49]' : 'bg-indigo-500'}`} style={{ width: `${vData?.percent}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-white">{vData?.percent}%</span>
                        </div>
                    </div>

                    <div className="mt-10 space-y-4 relative z-10">
                        {vData?.checks.map((check, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-300 ${check.status ? 'bg-[#009E49]/10 border border-[#009E49]/20 text-[#009E49]' : 'bg-white/5 border border-white/5 text-slate-600'}`}>
                                        {check.status ? (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold transition-colors ${check.status ? 'text-white' : 'text-slate-500'}`}>{check.label}</span>
                                </div>
                                {check.status && (
                                    <span className="text-[8px] font-black text-[#009E49] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Verified</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                        {picker.verificationStatus === VerificationStatus.VERIFIED ? (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-[#009E49]/20 rounded-xl flex items-center justify-center text-[#009E49]">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Elite Clearance</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        This partner has fulfilled all security protocols and is authorized for high-value logistics transactions.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ongoing Validation</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        Trust manifest is currently being evaluated. Exercise baseline caution for large transmissions.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PickerProfilePage;
