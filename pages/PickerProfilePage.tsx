import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, VerificationStatus } from '../types';
import { UserService } from '../services/UserService';

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
                            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
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
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Operating Region</p>
                            <p className="text-lg font-bold text-slate-900">Global (Tier 1)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Reviews (Mock) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl font-black text-slate-900">Performance Feedback</h3>
                    {[1, 2].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                {['JD', 'AS'][i]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 text-sm">{['John Doe', 'Alice Smith'][i]}</span>
                                    <span className="text-slate-300 text-xs">•</span>
                                    <span className="text-slate-400 text-xs">2 weeks ago</span>
                                </div>
                                <div className="flex text-amber-400 mb-2">
                                    {[...Array(5)].map((_, j) => (
                                        <svg key={j} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {['Excellent service and timely delivery. Very professional.', 'Great communication throughout the process. Highly recommended.'][i]}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest relative z-10">Verification Level</p>
                    <h3 className="text-3xl font-black mt-2 relative z-10">Gold Tier</h3>
                    <p className="mt-4 text-indigo-200 text-sm relative z-10">This partner has completed advanced identity verification and has a consistent track record.</p>

                    <div className="mt-8 space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="font-bold text-sm">Identity Verified</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="font-bold text-sm">Valid Phone Number</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="font-bold text-sm">Background Check Passed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PickerProfilePage;
