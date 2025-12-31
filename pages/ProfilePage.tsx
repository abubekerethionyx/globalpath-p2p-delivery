
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { UserService } from '../services/UserService';
import { useNavigate } from 'react-router-dom';

interface ProfilePageProps {
    user: User;
    onUserUpdate: (updatedUser: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [editedUser, setEditedUser] = useState<User>({ ...user });

    // Update editedUser when user prop changes
    useEffect(() => {
        setEditedUser({ ...user });
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updated = await UserService.updateUser(user.id, {
                name: editedUser.name,
                email: editedUser.email,
                phone_number: editedUser.phoneNumber,
                home_address: editedUser.homeAddress,
                emergency_contact: editedUser.emergencyContact,
                emergency_contact_phone: editedUser.emergencyContactPhone,
            } as any);
            onUserUpdate(updated);
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile. Please try again.');
        }
        setLoading(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const updated = await UserService.updateAvatar(user.id, file);
            onUserUpdate(updated);
            alert('Avatar updated successfully!');
        } catch (error) {
            console.error('Failed to upload avatar', error);
            alert('Failed to upload avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCancel = () => {
        setEditedUser({ ...user });
        setIsEditing(false);
    };

    const InfoField: React.FC<{ label: string; value?: string; field?: keyof User; isEditable?: boolean; type?: string }> = ({
        label,
        value,
        field,
        isEditable = true,
        type = 'text'
    }) => (
        <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</label>
            {isEditing && isEditable && field ? (
                <input
                    type={type}
                    value={editedUser[field] as string || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, [field]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/20 transition outline-none font-medium"
                />
            ) : (
                <p className="text-slate-900 font-bold">{value || 'Not provided'}</p>
            )}
        </div>
    );

    // Determine if verification is needed
    const needsVerification = user.role === UserRole.PICKER;

    return (
        <div className="space-y-8 animate-in pb-24 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Account Control</h1>
                        <p className="text-slate-500 font-medium font-bold text-xs uppercase tracking-widest">Protocol Partner ID: {user.id.split('-')[0]}</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition shadow-xl shadow-slate-100 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit Registry
                    </button>
                )}
            </div>

            {/* Verification Status Banner - Only for Pickers */}
            {needsVerification && (
                <div className={`p-8 rounded-[2rem] border-2 flex items-center justify-between shadow-sm ${user.verificationStatus === VerificationStatus.VERIFIED
                    ? 'bg-green-50/50 border-green-100'
                    : user.verificationStatus === VerificationStatus.PENDING
                        ? 'bg-amber-50/50 border-amber-100'
                        : 'bg-red-50/50 border-red-100'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${user.verificationStatus === VerificationStatus.VERIFIED
                            ? 'bg-[#009E49] text-white'
                            : user.verificationStatus === VerificationStatus.PENDING
                                ? 'bg-amber-500 text-white'
                                : 'bg-[#EF3340] text-white'
                            }`}>
                            {user.verificationStatus === VerificationStatus.VERIFIED ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            ) : user.verificationStatus === VerificationStatus.PENDING ? (
                                <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div>
                            <p className="font-black text-lg uppercase tracking-tight text-slate-900 leading-none mb-1">
                                {user.verificationStatus === VerificationStatus.VERIFIED
                                    ? 'Clearance Absolute'
                                    : user.verificationStatus === VerificationStatus.PENDING
                                        ? 'Reviewing Artifacts'
                                        : 'Identity Required'}
                            </p>
                            <p className="text-sm font-bold text-slate-400">
                                {user.verificationStatus === VerificationStatus.VERIFIED
                                    ? 'Your logistics node is fully authenticated in the global network.'
                                    : user.verificationStatus === VerificationStatus.PENDING
                                        ? 'Security protocols are currently validating your documentation.'
                                        : 'Mandatory verification is required to claim global marketplace shipments.'}
                            </p>
                        </div>
                    </div>
                    {user.verificationStatus === VerificationStatus.UNVERIFIED && (
                        <button
                            onClick={() => navigate('/registration')}
                            className="bg-[#EF3340] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D62832] transition shadow-xl shadow-red-100"
                        >
                            Complete Protocol
                        </button>
                    )}
                </div>
            )}

            {/* Profile Avatar and Basic Info */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <svg className="w-48 h-48 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl group/avatar relative">
                            {uploadingAvatar ? (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-black uppercase tracking-widest gap-2 z-10"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Update Portrait
                                </div>
                            )}
                            <img
                                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        {user.verificationStatus === VerificationStatus.VERIFIED && (
                            <div className="absolute -bottom-2 -right-2 bg-[#009E49] text-white w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left pt-2">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${user.role === UserRole.PICKER ? 'bg-indigo-600 text-white' :
                                    user.role === UserRole.SENDER ? 'bg-[#009E49] text-white' : 'bg-slate-900 text-white'
                                }`}>
                                {user.role} Partner
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold mb-8 uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {user.email}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Liquidity</p>
                                <p className="text-xl font-black text-[#009E49]">{(user.walletBalance ?? 0).toLocaleString()} <span className="text-[10px] opacity-30">ETB</span></p>
                            </div>
                            {user.role === UserRole.PICKER && (
                                <>
                                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">KPI Rating</p>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            <span className="text-xl font-black text-slate-900">{user.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Nodes Delivered</p>
                                        <p className="text-xl font-black text-slate-900">{user.completedDeliveries || 0}</p>
                                    </div>
                                </>
                            )}
                            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocol History</p>
                                <p className="text-xl font-black text-slate-900">{user.itemsCountThisMonth || 0} <span className="text-[10px] opacity-30">UNIT</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comprehensive Detail Registry */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Registry</h3>
                    </div>
                    {isEditing && (
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="px-8 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition"
                            >
                                Revert
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-[#009E49] text-white px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#007A38] transition shadow-xl shadow-green-100 disabled:opacity-50"
                            >
                                {loading ? 'Syncing...' : 'Seal Changes'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <InfoField label="Protocol Handlename" value={user.name} field="name" />
                    <InfoField label="Network Node (Email)" value={user.email} field="email" type="email" />
                    <InfoField label="Secure Line (Phone)" value={user.phoneNumber} field="phoneNumber" type="tel" />
                    <InfoField label="Residential Artifact (Address)" value={user.homeAddress} field="homeAddress" />
                </div>

                {/* Additional Metadata */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Established</p>
                        <p className="text-sm font-bold text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active since Protocol Genesis'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Privilege</p>
                        <p className="text-sm font-bold text-slate-900">{user.role} ACCESS LEVEL</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Flow</p>
                        <p className="text-sm font-bold text-slate-900">{user.itemsCountThisMonth} Active Units</p>
                    </div>
                </div>
            </div>

            {/* Advanced Verification Manifest - Only for Pickers */}
            {needsVerification && user.verificationStatus !== VerificationStatus.UNVERIFIED && (
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </div>

                    <h3 className="text-2xl font-black mb-10 tracking-tight flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FDD100]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        Security Manifest
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Identification Type</p>
                                <p className="text-lg font-black">{user.idType?.replace('_', ' ')}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{user.idType === 'NATIONAL_ID' ? 'National Identifier' : 'Passport Serial'}</p>
                                <p className="text-lg font-black tracking-widest font-mono">{user.idType === 'NATIONAL_ID' ? user.nationalId : user.passportNumber}</p>
                            </div>
                        </div>

                        {/* Document Visuals */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { url: user.idFrontUrl, label: "ID Front" },
                                { url: user.idBackUrl, label: "ID Back" },
                                { url: user.selfieUrl, label: "Biometric Selfie" }
                            ].map((doc, i) => doc.url && (
                                <div key={i} className="group relative aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
                                    <img src={doc.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={doc.label} />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-4 text-center">
                                        <p className="text-[8px] font-black uppercase tracking-widest">{doc.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Emergency Protocols - Pickers Only */}
            {user.role === UserRole.PICKER && (
                <div className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#EF3340] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Emergency Protocol</h4>
                            <p className="text-sm font-medium text-slate-500">Authorized personnel to contact in case of node failure.</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 flex items-center justify-around gap-8">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Liaison</p>
                            <p className="text-sm font-black text-slate-800">{user.emergencyContact || 'UNSPECIFIED'}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Line</p>
                            <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{user.emergencyContactPhone || 'UNSPECIFIED'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
