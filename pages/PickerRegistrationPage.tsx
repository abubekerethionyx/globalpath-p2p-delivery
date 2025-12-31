
import React, { useState, useRef } from 'react';
import { User, VerificationStatus } from '../types';
import { COUNTRIES } from '../constants';
import { UserService } from '../services/UserService';

interface PickerRegistrationPageProps {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PickerRegistrationPage: React.FC<PickerRegistrationPageProps> = ({ user, onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    idType: 'PASSPORT' as 'NATIONAL_ID' | 'PASSPORT',
    nationalId: '',
    passportNumber: '',
    passportExpiry: '',
    issuanceCountry: 'Ethiopia',
    phoneNumber: '',
    homeAddress: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    dateOfBirth: '',
    agreedToTerms: false,
    agreedToBackgroundCheck: false
  });

  const [uploads, setUploads] = useState<{ [key: string]: string | null }>({
    idFront: null,
    idBack: null,
    selfie: null,
    livenessVideo: null
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    idFront: null,
    idBack: null,
    selfie: null,
    livenessVideo: null
  });

  const fileInputRefs = {
    idFront: useRef<HTMLInputElement>(null),
    idBack: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
    livenessVideo: useRef<HTMLInputElement>(null)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      if (!formData.agreedToTerms || !formData.agreedToBackgroundCheck) {
        alert("You must agree to all legal declarations to proceed.");
        return;
      }

      try {
        const submitData = new FormData();

        // Append all text fields to FormData
        Object.entries(formData).forEach(([key, value]) => {
          submitData.append(key, String(value));
        });
        // Note: verification_status is automatically set to PENDING on backend

        // Append files to FormData
        if (files.idFront) submitData.append('idFront', files.idFront);
        if (files.idBack) submitData.append('idBack', files.idBack);
        if (files.selfie) submitData.append('selfie', files.selfie);
        if (files.livenessVideo) submitData.append('livenessVideo', files.livenessVideo);

        // Submit registration - backend saves all data and sets status to PENDING
        const updatedUser = await UserService.updateRegistration(user.id, submitData);
        alert("Registration Submitted Successfully! Your status is now PENDING review.");
        onSubmit(updatedUser);
      } catch (error) {
        console.error("Failed to submit registration", error);
        alert("Failed to submit registration. Please try again.");
      }
    }
  };

  const handleFileChange = (type: keyof typeof uploads, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploads(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (type: keyof typeof fileInputRefs) => {
    fileInputRefs[type].current?.click();
  };

  const renderStepIcon = (s: number) => (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${step === s
      ? 'bg-slate-900 text-white shadow-xl scale-110 ring-4 ring-slate-100'
      : step > s
        ? 'bg-[#009E49] text-white'
        : 'bg-slate-100 text-slate-400'
      }`}>
      {step > s ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      ) : s}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Security Header */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-[#009E49] rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">Identity Vault</h2>
              <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Enhanced Picker Verification Level 2</p>
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <svg className="w-64 h-64 rotate-12 text-[#FDD100]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" /></svg>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {renderStepIcon(1)}
            <div className={`h-1 w-8 rounded-full ${step > 1 ? 'bg-[#009E49]' : 'bg-slate-200'}`} />
            {renderStepIcon(2)}
            <div className={`h-1 w-8 rounded-full ${step > 2 ? 'bg-[#009E49]' : 'bg-slate-200'}`} />
            {renderStepIcon(3)}
            <div className={`h-1 w-8 rounded-full ${step > 3 ? 'bg-[#009E49]' : 'bg-slate-200'}`} />
            {renderStepIcon(4)}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Onboarding Progress</p>
            <p className="text-sm font-black text-slate-900">{Math.round((step / 4) * 100)}% Complete</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Document Type</h3>
                <p className="text-sm text-slate-500 font-medium">Select the primary document you will use for international travel verification.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, idType: 'PASSPORT' })}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.idType === 'PASSPORT' ? 'border-slate-900 bg-slate-50 ring-4 ring-slate-100' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${formData.idType === 'PASSPORT' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="font-black text-slate-900">International Passport</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Recommended for GlobalPath Elite</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, idType: 'NATIONAL_ID' })}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.idType === 'NATIONAL_ID' ? 'border-slate-900 bg-slate-50 ring-4 ring-slate-100' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${formData.idType === 'NATIONAL_ID' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0a2 2 0 002 2h2a2 2 0 002-2M9 14a3 3 0 116 0 3 3 0 01-6 0z" /></svg>
                  </div>
                  <p className="font-black text-slate-900">National ID Card</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Available for Local/Regional picks</p>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ID/Passport Number</label>
                  <input
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder={formData.idType === 'PASSPORT' ? 'e.g. EP1234567' : 'e.g. 123456789'}
                    value={formData.idType === 'PASSPORT' ? formData.passportNumber : formData.nationalId}
                    onChange={e => setFormData({ ...formData, [formData.idType === 'PASSPORT' ? 'passportNumber' : 'nationalId']: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issuance Country</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    value={formData.issuanceCountry}
                    onChange={e => setFormData({ ...formData, issuanceCountry: e.target.value })}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {formData.idType === 'PASSPORT' && (
                  <div className="col-span-full">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passport Expiry Date</label>
                    <input
                      type="date" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                      value={formData.passportExpiry}
                      onChange={e => setFormData({ ...formData, passportExpiry: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Personal Profile</h3>
                <p className="text-sm text-slate-500 font-medium">Verify your primary residence and emergency contact details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Residential Address</label>
                  <textarea
                    rows={3} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Street Name, Sub-City, Woreda, Addis Ababa"
                    value={formData.homeAddress}
                    onChange={e => setFormData({ ...formData, homeAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Phone Number</label>
                  <input
                    type="tel" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="+251 9XX XXX XXX"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                  <input
                    type="date" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Contact Name</label>
                  <input
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Contact Full Name"
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Phone</label>
                  <input
                    type="tel" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="+251 ..."
                    value={formData.emergencyContactPhone}
                    onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Biometric & Doc Upload</h3>
                <p className="text-sm text-slate-500 font-medium">Please provide high-quality scans or photos for manual review.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Hidden Inputs */}
                <input type="file" className="hidden" ref={fileInputRefs.idFront} accept="image/*" onChange={(e) => handleFileChange('idFront', e)} />
                <input type="file" className="hidden" ref={fileInputRefs.idBack} accept="image/*" onChange={(e) => handleFileChange('idBack', e)} />
                <input type="file" className="hidden" ref={fileInputRefs.selfie} accept="image/*" onChange={(e) => handleFileChange('selfie', e)} />
                <input type="file" className="hidden" ref={fileInputRefs.livenessVideo} accept="video/*" onChange={(e) => handleFileChange('livenessVideo', e)} />

                <div
                  onClick={() => triggerUpload('idFront')}
                  className={`p-8 border-2 border-dashed rounded-[2rem] text-center transition-all cursor-pointer group relative overflow-hidden ${uploads.idFront ? 'border-[#009E49] bg-green-50' : 'border-slate-200 hover:border-slate-900'}`}
                >
                  {uploads.idFront && <img src={uploads.idFront} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />}
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 relative z-10 ${uploads.idFront ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                    {uploads.idFront ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </div>
                  <p className="font-black text-slate-900 text-sm relative z-10">{formData.idType === 'PASSPORT' ? 'Passport Data Page' : 'ID Front'}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest relative z-10">{uploads.idFront ? 'File Loaded' : 'Clear color scan'}</p>
                </div>

                <div
                  onClick={() => triggerUpload('idBack')}
                  className={`p-8 border-2 border-dashed rounded-[2rem] text-center transition-all cursor-pointer group relative overflow-hidden ${uploads.idBack ? 'border-[#009E49] bg-green-50' : 'border-slate-200 hover:border-slate-900'}`}
                >
                  {uploads.idBack && <img src={uploads.idBack} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />}
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 relative z-10 ${uploads.idBack ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                    {uploads.idBack ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <p className="font-black text-slate-900 text-sm relative z-10">{formData.idType === 'PASSPORT' ? 'Passport Visa Page' : 'ID Back'}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest relative z-10">{uploads.idBack ? 'File Loaded' : 'Required for regional'}</p>
                </div>

                <div
                  onClick={() => triggerUpload('selfie')}
                  className={`p-8 border-2 border-dashed rounded-[2rem] text-center transition-all cursor-pointer group relative overflow-hidden ${uploads.selfie ? 'border-[#009E49] bg-green-50' : 'border-slate-200 hover:border-slate-900'}`}
                >
                  {uploads.selfie && <img src={uploads.selfie} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />}
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 relative z-10 ${uploads.selfie ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                    {uploads.selfie ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <p className="font-black text-slate-900 text-sm relative z-10">Liveness Selfie</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest relative z-10">{uploads.selfie ? 'Face Captured' : 'Ensure clear face'}</p>
                </div>

                <div
                  onClick={() => triggerUpload('livenessVideo')}
                  className={`p-8 border-2 border-dashed rounded-[2rem] text-center transition-all cursor-pointer group relative overflow-hidden ${uploads.livenessVideo ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-600'}`}
                >
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 relative z-10 ${uploads.livenessVideo ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    {uploads.livenessVideo ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <p className="font-black text-slate-900 text-sm relative z-10">Liveness Video</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest relative z-10">{uploads.livenessVideo ? 'Video Recorded' : 'Briefly record yourself'}</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in">
              <div className="space-y-2 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                  <svg className="w-10 h-10 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20a10.003 10.003 0 006.235-2.397l.054.09a9.963 9.963 0 002.323-5.603m-2.22-6.52A10.003 10.003 0 0112 2c-4.14 0-7.734 2.493-9.324 6.084m12.186 11.916A10.003 10.003 0 0112 22a10.003 10.003 0 01-2.862-.418m2.13-1.666a4.002 4.002 0 00-6.536-1.554M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Final Declaration</h3>
                <p className="text-sm text-slate-500 font-medium">Please review and sign our professional code of conduct.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start p-6 rounded-3xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={formData.agreedToTerms}
                    onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  />
                  <div className="ml-4">
                    <p className="text-sm font-black text-slate-900">Legal Terms & P2P Policy</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">I understand that I am personally responsible for items I deliver and must comply with international customs regulations of origin and destination countries.</p>
                  </div>
                </label>

                <label className="flex items-start p-6 rounded-3xl border-2 border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={formData.agreedToBackgroundCheck}
                    onChange={e => setFormData({ ...formData, agreedToBackgroundCheck: e.target.checked })}
                  />
                  <div className="ml-4">
                    <p className="text-sm font-black text-slate-900">Background Verification</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">I consent to GlobalPath performing a manual and digital background check using the documents provided to ensure platform safety.</p>
                  </div>
                </label>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-[#FDD100]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Review SLA</p>
                    <p className="text-sm font-bold">~24 Hours Wait Time</p>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Priority: High</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            {step === 1 ? (
              <button type="button" onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition border border-slate-100 rounded-2xl">Abort</button>
            ) : (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition border border-slate-100 rounded-2xl">Previous Step</button>
            )}
            <button
              type="submit"
              className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-black shadow-2xl transition-all duration-300 active:scale-95"
            >
              {step === 4 ? 'Seal My Verification' : 'Proceed to Next Phase'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center mt-8 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">GlobalPath Cryptographic Identity Standard v4.2</p>
    </div>
  );
};

export default PickerRegistrationPage;
