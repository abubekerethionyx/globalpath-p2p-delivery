
import React, { useState } from 'react';
import { User, VerificationStatus, UserRole } from '../../types';

interface AdminUsersTabProps {
  users: User[];
  onVerify: (userId: string, status: VerificationStatus) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onVerify }) => {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const toggleUserExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const openModal = (type: 'image' | 'video', url: string) => {
    setModalContent({ type, url });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.SENDER}>Senders</option>
            <option value={UserRole.PICKER}>Pickers</option>
            <option value={UserRole.ADMIN}>Admins</option>
          </select>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {filteredUsers.length} Active Records
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
            <tr>
              <th className="px-8 py-6">Identity & Digital Footprint</th>
              <th className="px-8 py-6">Privilege Group</th>
              <th className="px-8 py-6">Security Clearance</th>
              <th className="px-8 py-6 text-center">Protocol Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic-none">
            {filteredUsers.map(u => {
              const isExpanded = expandedUserId === u.id;
              const isPicker = u.role === UserRole.PICKER;
              const isPending = u.verificationStatus === VerificationStatus.PENDING;

              return (
                <React.Fragment key={u.id}>
                  <tr className={`transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={u.avatar} className="w-10 h-10 rounded-xl mr-3 border border-slate-200" alt="" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white' :
                        u.role === UserRole.PICKER ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-green-100 text-green-700' :
                          u.verificationStatus === VerificationStatus.PENDING ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {u.verificationStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{u.createdAt || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      {isPicker ? (
                        <button
                          onClick={() => toggleUserExpand(u.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isExpanded
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : isPending
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600'
                            }`}
                        >
                          {isExpanded ? 'Close Details' : isPending ? 'Review Verification' : 'View Profile'}
                        </button>
                      ) : (
                        <button className="text-slate-300 cursor-not-allowed">
                          <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && isPicker && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/50 p-0 border-b border-slate-200">
                        <div className="p-8 animate-in space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Identification (Manual Check)</p>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Document Type</p>
                                  <p className="text-sm font-black text-slate-900">{u.idType || 'NOT SPECIFIED'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">ID Number / Passport</p>
                                  <p className="text-sm font-bold text-slate-800">{u.passportNumber || u.nationalId || 'N/A'}</p>
                                </div>
                                {u.passportExpiry && (
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Expiry Date</p>
                                    <p className="text-sm font-bold text-slate-800">{u.passportExpiry}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Issuance Country</p>
                                  <p className="text-sm font-bold text-slate-800">{u.issuanceCountry || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Contact & Residential</p>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Primary Phone</p>
                                  <p className="text-sm font-bold text-slate-800">{u.phoneNumber || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Home Address</p>
                                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{u.homeAddress || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">Emergency Contact</p>
                                  <p className="text-sm font-bold text-slate-800">{u.emergencyContact || 'N/A'} ({u.emergencyContactPhone || 'N/A'})</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Security Signal</p>
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Selfie Check</span>
                                    {u.selfieUrl ? (
                                      <span className="text-green-600 flex items-center text-[10px] font-black uppercase">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                        Provided
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] font-black uppercase">Missing</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Liveness Video</span>
                                    {u.livenessVideo ? (
                                      <span className="text-green-600 flex items-center text-[10px] font-black uppercase">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                        Available
                                      </span>
                                    ) : (
                                      <span className="text-amber-500 text-[10px] font-black uppercase">NOT PROVIDED</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Trust Index</p>
                                <p className="text-lg font-black text-indigo-600">Level 2</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Verification Documents</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              <div
                                className={`aspect-[3/4] bg-slate-200 rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm ${u.idFrontUrl ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all' : ''}`}
                                onClick={() => u.idFrontUrl && openModal('image', u.idFrontUrl)}
                              >
                                {u.idFrontUrl ? <img src={u.idFrontUrl} className="w-full h-full object-cover" alt="ID Front" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">No Image</div>}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white">
                                  <p className="text-[9px] font-black uppercase">ID Front</p>
                                </div>
                                {u.idFrontUrl && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                  </div>
                                )}
                              </div>
                              <div
                                className={`aspect-[3/4] bg-slate-200 rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm ${u.idBackUrl ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all' : ''}`}
                                onClick={() => u.idBackUrl && openModal('image', u.idBackUrl)}
                              >
                                {u.idBackUrl ? <img src={u.idBackUrl} className="w-full h-full object-cover" alt="ID Back" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">No Image</div>}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white">
                                  <p className="text-[9px] font-black uppercase">ID Back</p>
                                </div>
                                {u.idBackUrl && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                  </div>
                                )}
                              </div>
                              <div
                                className={`aspect-[3/4] bg-slate-200 rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm ${u.selfieUrl ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all' : ''}`}
                                onClick={() => u.selfieUrl && openModal('image', u.selfieUrl)}
                              >
                                {u.selfieUrl ? <img src={u.selfieUrl} className="w-full h-full object-cover" alt="Selfie" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">No Selfie</div>}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white">
                                  <p className="text-[9px] font-black uppercase">Biometric Selfie</p>
                                </div>
                                {u.selfieUrl && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                  </div>
                                )}
                              </div>
                              <div
                                className={`aspect-[3/4] bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center relative group shadow-sm overflow-hidden ${u.livenessVideo ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all' : ''}`}
                                onClick={() => u.livenessVideo && openModal('video', u.livenessVideo)}
                              >
                                {u.livenessVideo ? (
                                  <div className="flex flex-col items-center p-6 text-center">
                                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-700 uppercase">Review Video</p>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 text-[10px] font-bold uppercase">No Video</div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-indigo-900/80 p-3 text-white">
                                  <p className="text-[9px] font-black uppercase">Liveness Recording</p>
                                </div>
                                {u.livenessVideo && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPending ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20a10.003 10.003 0 006.235-2.397l.054.09a9.963 9.963 0 002.323-5.603m-2.22-6.52A10.003 10.003 0 0112 2c-4.14 0-7.734 2.493-9.324 6.084m12.186 11.916A10.003 10.003 0 0112 22a10.003 10.003 0 01-2.862-.418m2.13-1.666a4.002 4.002 0 00-6.536-1.554M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Verification Decision</h3>
                                <p className="text-sm text-slate-500 font-medium">Review the manifest above before finalizing security status for {u.name}.</p>
                              </div>
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                              <button onClick={() => onVerify(u.id, VerificationStatus.UNVERIFIED)} className="flex-1 lg:flex-none py-4 px-10 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition uppercase text-xs tracking-widest">Reject</button>
                              <button onClick={() => onVerify(u.id, VerificationStatus.VERIFIED)} disabled={u.verificationStatus === VerificationStatus.VERIFIED} className="flex-1 lg:flex-none py-4 px-12 bg-[#009E49] text-white font-black rounded-2xl hover:bg-[#007A38] transition shadow-xl shadow-green-100 uppercase text-xs tracking-[0.2em] disabled:opacity-50">Seal Approval</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <div className="py-32 text-center text-slate-400 font-bold">No registered users found.</div>}

        {/* Modal for viewing full-size images and videos */}
        {modalContent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {modalContent.type === 'image' ? (
                <img
                  src={modalContent.url}
                  alt="Verification Document"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={modalContent.url}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
