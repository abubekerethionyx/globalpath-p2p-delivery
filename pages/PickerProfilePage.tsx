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
            { label: 'Email Verified', status: picker.isEmailVerified, weight: 1 },
            { label: 'Phone Registry', status: picker.isPhoneVerified || !!picker.phoneNumber, weight: 1 },
            { label: 'Resident Artifact', status: !!picker.homeAddress, weight: 1 },
            { label: 'Emergency Protocol', status: !!picker.emergencyContact, weight: 1 },
            { label: 'Identity Documents', status: !!(picker.nationalId || picker.passportNumber), weight: 1 },
            { label: 'Portraits & Biometrics', status: !!(picker.selfieUrl && picker.idFrontUrl), weight: 1 },
            { label: 'Manual Clearance', status: picker.verificationStatus === VerificationStatus.VERIFIED, weight: 1 },
        ];

        const completed = checks.filter(c => c.status).length;
        const total = checks.length;
        const percent = Math.round((completed / total) * 100);

        let tier = "Unverified Node";
        let tierColor = "text-slate-400";
        let level = 0;

        if (picker.verificationStatus === VerificationStatus.VERIFIED) {
            tier = "Verified Partner";
            tierColor = "text-[#009E49]";
            level = 4;
        } else if (completed >= 5) {
            tier = "Pro Tier (Level 3)";
            tierColor = "text-indigo-400";
            level = 3;
        } else if (completed >= 3) {
            tier = "Active Tier (Level 2)";
            tierColor = "text-amber-400";
            level = 2;
        } else if (completed >= 1) {
            tier = "Basic Tier (Level 1)";
            tierColor = "text-blue-400";
            level = 1;
        }

        return { checks, completed, total, percent, tier, tierColor, level };
    };

    const vData = getVerificationData();

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 pt-12 space-y-12 animate-in fade-in duration-700 pb-24">
            {/* Header / Nav */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Partner Profile</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Logistics Partner Detail</h1>
                </div>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
                <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-slate-200 flex items-center justify-center text-4xl font-black text-slate-400 overflow-hidden">
                                {picker.avatar ? (
                                    <img src={picker.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{picker.firstName?.[0]}{picker.lastName?.[0]}</span>
                                )}
                            </div>
                            {picker.verificationStatus === VerificationStatus.VERIFIED && (
                                <div className="absolute -bottom-2 -right-2 bg-[#009E49] text-white p-2 rounded-xl shadow-lg border-4 border-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-12 px-8 md:px-12 flex flex-col md:flex-row justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-900">{picker.firstName} {picker.lastName}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${picker.verificationStatus === VerificationStatus.VERIFIED
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {picker.verificationStatus === VerificationStatus.VERIFIED ? 'Verified Partner' : 'Verification Pending'}
                            </span>
                            <span className="text-slate-400 font-bold text-sm">Joined {new Date(picker.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                            <button
                                onClick={handleMessage}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Send Message
                            </button>
                            <button className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                                Report Issue
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 min-w-[300px]">
                        <div className="bg-slate-50 p-6 rounded-[2rem]">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Reliability Score</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-slate-900">{(picker.rating || 0).toFixed(1)}</span>
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-4 h-4 ${i < Math.floor(picker.rating || 0) ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem]">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Delivered Units</p>
                            <p className="text-3xl font-black text-slate-900">{picker.completedDeliveries}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] col-span-2">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Delivery Time</p>
                            <p className="text-xl font-black text-slate-900">
                                {picker.averageDeliveryTime
                                    ? `${picker.averageDeliveryTime < 24 ? picker.averageDeliveryTime.toFixed(1) + ' hrs' : (picker.averageDeliveryTime / 24).toFixed(1) + ' days'}`
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Reviews (Mock) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl font-black text-slate-900">Performance Feedback</h3>

                    <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">Feedback & Reporting Coming Soon</h4>
                        <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                            Our team is currently implementing a decentralized trust protocol for verified feedback. Stay tuned for the update.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"></div>

                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">System Trust Manifest</p>
                        <h3 className={`text-3xl font-black mt-2 relative z-10 ${vData?.tierColor}`}>{vData?.tier}</h3>
                        <div className="mt-4 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${vData?.percent}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-indigo-400">{vData?.percent}%</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3 relative z-10">
                        {vData?.checks.map((check, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${check.status ? 'bg-[#009E49]/20' : 'bg-red-500/20'}`}>
                                        {check.status ? (
                                            <svg className="w-3 h-3 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-2.5 h-2.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold ${check.status ? 'text-white' : 'text-slate-500'}`}>{check.label}</span>
                                </div>
                                {!check.status && (
                                    <span className="text-[8px] font-black text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Required for Level {vData.level + 1}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {vData && vData.completed < vData.total && (
                        <div className="mt-8 p-4 bg-indigo-600/20 border border-indigo-600/30 rounded-2xl relative z-10">
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Missing Credentials</p>
                            <p className="text-[10px] text-indigo-100/60 leading-tight">
                                Complete the protocol to reach the next tier and unlock higher value shipments.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PickerProfilePage;
