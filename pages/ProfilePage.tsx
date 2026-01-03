
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { UserService } from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../constants.tsx';

interface ProfilePageProps {
    user: User;
    onUserUpdate: (updatedUser: User) => void;
}

const InfoField: React.FC<{
    label: string;
    value?: string;
    field?: keyof User;
    isEditable?: boolean;
    type?: string;
    isEditing: boolean;
    editedUser: User;
    setEditedUser: (user: User) => void;
}> = ({
    label,
    value,
    field,
    isEditing,
    editedUser,
    setEditedUser,
    isEditable = true,
    type = 'text'
}) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
            {isEditing && isEditable && field ? (
                <input
                    type={type}
                    value={(editedUser[field] as string) || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, [field]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/10 transition outline-none font-medium text-sm"
                />
            ) : (
                <p className="text-slate-900 font-bold text-sm">{value || 'Not provided'}</p>
            )}
        </div>
    );

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [editedUser, setEditedUser] = useState<User>({ ...user });

    // KYC / Registration States
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        idFront: null,
        idBack: null,
        selfie: null,
        livenessVideo: null
    });
    const [previews, setPreviews] = useState<{ [key: string]: string | null }>({
        idFront: user.idFrontUrl || null,
        idBack: user.idBackUrl || null,
        selfie: user.selfieUrl || null,
        livenessVideo: user.livenessVideo || null
    });
    const fileInputRefs = {
        idFront: useRef<HTMLInputElement>(null),
        idBack: useRef<HTMLInputElement>(null),
        selfie: useRef<HTMLInputElement>(null),
        livenessVideo: useRef<HTMLInputElement>(null)
    };

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToBackgroundCheck, setAgreedToBackgroundCheck] = useState(false);

    // Update editedUser when user prop changes
    useEffect(() => {
        setEditedUser({ ...user });
    }, [user]);

    const getVerificationData = () => {
        const checks = [
            { label: 'Email Verified', status: user.isEmailVerified },
            { label: 'Phone Registry', status: user.isPhoneVerified || !!user.phoneNumber },
            { label: 'Resident Artifact', status: !!user.homeAddress },
            { label: 'Emergency Protocol', status: !!user.emergencyContact },
            { label: 'Identity Documents', status: !!(user.nationalId || user.passportNumber) },
            { label: 'Portraits & Biometrics', status: !!(user.selfieUrl && user.idFrontUrl) },
            { label: 'Manual Clearance', status: user.verificationStatus === VerificationStatus.VERIFIED },
        ];

        const completed = checks.filter(c => c.status).length;
        const total = checks.length;
        const percent = Math.round((completed / total) * 100);

        let tier = "Unverified";
        let tierColor = "text-slate-400";
        if (user.verificationStatus === VerificationStatus.VERIFIED) {
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

    const handleSave = async () => {
        setLoading(true);
        try {
            // If any sensitive fields or files are changed, we might want to use the registration endpoint
            const hasFilesToUpload = Object.values(files).some(f => f !== null);

            if (hasFilesToUpload) {
                if (!agreedToTerms || !agreedToBackgroundCheck) {
                    alert("You must agree to the Terms of Service and Background Check to submit verification documents.");
                    setLoading(false);
                    return;
                }
                const submitData = new FormData();
                // Map all edited fields to FormData
                submitData.append('firstName', editedUser.firstName);
                submitData.append('lastName', editedUser.lastName);
                submitData.append('email', editedUser.email);
                submitData.append('phoneNumber', editedUser.phoneNumber || '');
                submitData.append('homeAddress', editedUser.homeAddress || '');
                submitData.append('emergencyContact', editedUser.emergencyContact || '');
                submitData.append('emergencyContactPhone', editedUser.emergencyContactPhone || '');
                submitData.append('idType', editedUser.idType || 'PASSPORT');
                submitData.append('nationalId', editedUser.nationalId || '');
                submitData.append('passportNumber', editedUser.passportNumber || '');
                submitData.append('passportExpiry', editedUser.passportExpiry || '');
                submitData.append('issuanceCountry', editedUser.issuanceCountry || 'Ethiopia');
                submitData.append('dateOfBirth', editedUser.dateOfBirth || '');

                // Privacy Settings
                submitData.append('hide_phone_number', String(editedUser.hidePhoneNumber));
                submitData.append('hide_rating', String(editedUser.hideRating));
                submitData.append('hide_completed_deliveries', String(editedUser.hideCompletedDeliveries));
                submitData.append('hide_email', String(editedUser.hideEmail));

                // Files
                if (files.idFront) submitData.append('idFront', files.idFront);
                if (files.idBack) submitData.append('idBack', files.idBack);
                if (files.selfie) submitData.append('selfie', files.selfie);
                if (files.livenessVideo) submitData.append('livenessVideo', files.livenessVideo);

                const updated = await UserService.updateRegistration(user.id, submitData);
                onUserUpdate(updated);
                alert('Verification documents submitted for review.');
            } else {
                // Standard profile update
                const updated = await UserService.updateUser(user.id, {
                    first_name: editedUser.firstName,
                    last_name: editedUser.lastName,
                    email: editedUser.email,
                    phone_number: editedUser.phoneNumber,
                    home_address: editedUser.homeAddress,
                    emergency_contact: editedUser.emergencyContact,
                    emergency_contact_phone: editedUser.emergencyContactPhone,
                    id_type: editedUser.idType,
                    national_id: editedUser.nationalId,
                    passport_number: editedUser.passportNumber,
                    passport_expiry: editedUser.passportExpiry,
                    issuance_country: editedUser.issuanceCountry,
                    date_of_birth: editedUser.dateOfBirth,
                    hide_phone_number: editedUser.hidePhoneNumber,
                    hide_rating: editedUser.hideRating,
                    hide_completed_deliveries: editedUser.hideCompletedDeliveries,
                    hide_email: editedUser.hideEmail,
                } as any);
                onUserUpdate(updated);
                alert('Profile updated successfully.');
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile. Please try again.');
        }
        setLoading(false);
    };

    const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
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


    // Determine if verification is needed
    const needsVerification = user.role === UserRole.PICKER;

    return (
        <div className="space-y-8 animate-in pb-24 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Account Settings</h1>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Profile ID: {user.id.split('-')[0]}</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition shadow-xl shadow-slate-100 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Verification Progress Manifest - Only for Pickers */}
            {needsVerification && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className={`lg:col-span-12 p-8 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 transition-all ${user.verificationStatus === VerificationStatus.VERIFIED
                        ? 'bg-green-50/50 border-green-100'
                        : user.verificationStatus === VerificationStatus.PENDING
                            ? 'bg-amber-50/50 border-amber-100'
                            : 'bg-red-50/50 border-red-100'
                        }`}>
                        <div className="flex items-center gap-6 flex-1">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${user.verificationStatus === VerificationStatus.VERIFIED
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
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`font-black text-base uppercase tracking-tight leading-none ${vData.tierColor}`}>
                                        {vData.tier} Status
                                    </p>
                                    <span className="text-[10px] font-black text-slate-400">{vData.percent}% Profile Strength</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${vData.percent}%` }}></div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">
                                    {user.verificationStatus === VerificationStatus.VERIFIED
                                        ? 'Your account is fully verified.'
                                        : user.verificationStatus === VerificationStatus.PENDING
                                            ? 'We are currently reviewing your documents.'
                                            : 'Complete your verification to unlock more features.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:max-w-xs justify-end">
                            {vData.checks.map((check, i) => (
                                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${check.status ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                    {check.status ? (
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                    {check.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Avatar and Basic Info */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <svg className="w-48 h-48 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-xl group/avatar relative">
                            {uploadingAvatar ? (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[8px] font-black uppercase tracking-widest gap-1 z-10"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Update Photo
                                </div>
                            )}
                            <img
                                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.firstName}
                                alt={user.firstName}
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
                            <div className="absolute -bottom-1 -right-1 bg-[#009E49] text-white w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left pt-2">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.firstName} {user.lastName}</h2>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${user.role === UserRole.PICKER ? 'bg-indigo-600 text-white' :
                                user.role === UserRole.SENDER ? 'bg-[#009E49] text-white' : 'bg-slate-900 text-white'
                                }`}>
                                {user.role} Account
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold mb-8 uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {user.email}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Balance</p>
                                <p className="text-lg font-black text-[#009E49]">{(user.walletBalance ?? 0).toLocaleString()} <span className="text-[9px] opacity-30">ETB</span></p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">λ Credits</p>
                                <p className="text-lg font-black text-indigo-600">{(user.coinsBalance ?? 0).toLocaleString()} <span className="text-[9px] opacity-30">λ</span></p>
                            </div>
                            {user.role === UserRole.PICKER && (
                                <>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            <span className="text-lg font-black text-slate-900">{user.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Deliveries</p>
                                        <p className="text-lg font-black text-slate-900">{user.completedDeliveries || 0}</p>
                                    </div>
                                </>
                            )}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Activity</p>
                                <p className="text-lg font-black text-slate-900">{user.itemsCountThisMonth || 0} <span className="text-[9px] opacity-30">UNIT</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comprehensive Detail Registry */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Personal Information</h3>
                    </div>
                    {isEditing && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-[#009E49] text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#007A38] transition shadow-lg shadow-green-100 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InfoField label="First Name" value={user.firstName} field="firstName" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <InfoField label="Last Name" value={user.lastName} field="lastName" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <InfoField label="Email Address" value={user.email} field="email" type="email" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <InfoField label="Date of Birth" value={user.dateOfBirth} field="dateOfBirth" type="date" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <InfoField label="Phone Number" value={user.phoneNumber} field="phoneNumber" type="tel" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                    <InfoField label="Home Address" value={user.homeAddress} field="homeAddress" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />

                    {isEditing && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Issuance Country</label>
                                <select
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/10 transition outline-none font-medium text-sm"
                                    value={editedUser.issuanceCountry || 'Ethiopia'}
                                    onChange={e => setEditedUser({ ...editedUser, issuanceCountry: e.target.value })}
                                >
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {(editedUser.idType || user.idType) === 'PASSPORT' && (
                                <InfoField label="Passport Expiry" value={user.passportExpiry} field="passportExpiry" type="date" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                            )}
                            <InfoField label="Emergency Contact" value={user.emergencyContact} field="emergencyContact" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                            <InfoField label="Emergency Phone" value={user.emergencyContactPhone} field="emergencyContactPhone" type="tel" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                        </>
                    )}
                </div>

                {/* Additional Metadata */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joined</p>
                        <p className="text-xs font-bold text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Joined at System Launch'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Account Role</p>
                        <p className="text-xs font-bold text-slate-900">{user.role} ACCESS</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monthly Activity</p>
                        <p className="text-xs font-bold text-slate-900">{user.itemsCountThisMonth} Active Units</p>
                    </div>
                </div>
            </div>

            {/* Verification Documents - Only for Pickers */}
            {needsVerification && (
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </div>

                    <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-4">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-[#FDD100]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        Identity Verification
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">ID Type</p>
                                {isEditing ? (
                                    <select
                                        value={editedUser.idType || 'NATIONAL_ID'}
                                        onChange={(e) => setEditedUser({ ...editedUser, idType: e.target.value as any })}
                                        className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-[#009E49] focus:ring-1 focus:ring-[#009E49] outline-none font-bold text-sm"
                                    >
                                        <option value="NATIONAL_ID">National ID</option>
                                        <option value="PASSPORT">Passport</option>
                                    </select>
                                ) : (
                                    <p className="text-base font-black">{user.idType?.replace('_', ' ') || 'Not Set'}</p>
                                )}
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">
                                    {(editedUser.idType || user.idType) === 'NATIONAL_ID' ? 'ID Number' : 'Passport Number'}
                                </p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={((editedUser.idType || user.idType) === 'NATIONAL_ID' ? editedUser.nationalId : editedUser.passportNumber) || ''}
                                        onChange={(e) => {
                                            if ((editedUser.idType || user.idType) === 'NATIONAL_ID') {
                                                setEditedUser({ ...editedUser, nationalId: e.target.value });
                                            } else {
                                                setEditedUser({ ...editedUser, passportNumber: e.target.value });
                                            }
                                        }}
                                        className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-[#009E49] focus:ring-1 focus:ring-[#009E49] outline-none font-mono font-bold tracking-widest text-sm"
                                        placeholder="ENTER ID NUMBER"
                                    />
                                ) : (
                                    <p className="text-base font-black tracking-widest font-mono">
                                        {((user.idType) === 'NATIONAL_ID' ? user.nationalId : user.passportNumber) || 'UNSET'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Document Uploads */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: 'idFront', label: "ID Front", url: user.idFrontUrl },
                                { key: 'idBack', label: "ID Back", url: user.idBackUrl },
                                { key: 'selfie', label: "Selfie", url: user.selfieUrl },
                                { key: 'livenessVideo', label: "Liveness Check", url: user.livenessVideo, isVideo: true }
                            ].map((doc, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div
                                        onClick={() => isEditing && (fileInputRefs as any)[doc.key].current?.click()}
                                        className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${isEditing ? 'border-dashed border-white/20 cursor-pointer hover:border-white/50' : 'border-white/10'}`}
                                    >
                                        {previews[doc.key] ? (
                                            doc.isVideo ? (
                                                <video src={previews[doc.key]!} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={previews[doc.key]!} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={doc.label} />
                                            )
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 text-white/10">
                                                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 4m4 0v12" /></svg>
                                                <p className="text-[7px] font-black uppercase tracking-widest">Upload Document</p>
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <p className="text-[9px] font-black text-white uppercase tracking-widest">Update</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm px-2 py-1.5 text-center">
                                            <p className="text-[7px] font-black uppercase tracking-widest">{doc.label}</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={(fileInputRefs as any)[doc.key]}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(doc.key, e)}
                                        accept={doc.isVideo ? "video/*" : "image/*"}
                                    />
                                </div>
                            ))}
                        </div>

                        {isEditing && (
                            <div className="col-span-full mt-6 p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="mt-1"
                                    />
                                    <label htmlFor="terms" className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest cursor-pointer">
                                        I declare that all provided documents are authentic and I agree to the Terms of Service.
                                    </label>
                                </div>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="background"
                                        checked={agreedToBackgroundCheck}
                                        onChange={e => setAgreedToBackgroundCheck(e.target.checked)}
                                        className="mt-1"
                                    />
                                    <label htmlFor="background" className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest cursor-pointer">
                                        I authorize the system to perform a background verification on my history.
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Emergency Contact - Pickers Only */}
            {user.role === UserRole.PICKER && (
                <div className="bg-red-50/50 rounded-[2rem] border border-red-100 p-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#EF3340] text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">Emergency Contact</h4>
                            <p className="text-xs font-medium text-slate-500">Who should we contact in an emergency?</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 flex items-center justify-around gap-6">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Name</p>
                            <p className="text-sm font-black text-slate-800">{user.emergencyContact || 'Not Provided'}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Phone</p>
                            <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{user.emergencyContactPhone || 'Not Provided'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Settings */}
            <div className={`bg-white rounded-[2rem] p-6 border transition-all ${isEditing ? 'border-indigo-100 shadow-xl' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Privacy Settings</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage what others see</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {[
                            { label: 'Show Email', field: 'hideEmail', desc: 'Allow others to see your email address.' },
                            { label: 'Show Phone', field: 'hidePhoneNumber', desc: 'Display your phone number to active partners.' },
                            { label: 'Show Rating', field: 'hideRating', fieldReversed: true, desc: 'Show your rating to others.' },
                            { label: 'Delivery Count', field: 'hideCompletedDeliveries', fieldReversed: true, desc: 'Display number of successful deliveries.' }
                        ].map((item) => {
                            const isHidden = (editedUser as any)[item.field];
                            const isActive = item.fieldReversed ? !isHidden : !isHidden;

                            return (
                                <div key={item.field} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">{item.label}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                    <button
                                        disabled={!isEditing}
                                        onClick={() => setEditedUser({ ...editedUser, [item.field]: !isHidden })}
                                        className={`w-10 h-6 rounded-full relative transition-all duration-300 ${!isEditing ? 'opacity-50 grayscale' : ''} ${isActive ? 'bg-[#009E49]' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-200 flex flex-col justify-center text-center">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Privacy Note</h4>
                        <p className="text-xs font-medium text-amber-700 leading-relaxed">
                            Hiding your rating or delivery history may decrease your <span className="font-black">booking request success</span> by up to <span className="font-black text-lg">40%</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ProfilePage;
