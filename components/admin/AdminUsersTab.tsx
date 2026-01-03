
import React, { useState, useEffect, useCallback } from 'react';
import { User, VerificationStatus, UserRole } from '../../types';
import { UserService } from '../../services/UserService';
import { debounce } from 'lodash';

interface AdminUsersTabProps {
  onVerify: (userId: string, status: VerificationStatus) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onVerify }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchUsers = async (page: number, search: string, role: string, status: string) => {
    setLoading(true);
    try {
      const response = await UserService.getAllUsers({
        page,
        per_page: 15,
        search,
        role: role === 'ALL' ? undefined : role,
        status: status === 'ALL' ? undefined : status
      });
      setUsers(response.users);
      setTotalPages(response.pages);
      setTotalRecords(response.total);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((page, search, role, status) => {
      fetchUsers(page, search, role, status);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedFetch(currentPage, searchTerm, filterRole, filterStatus);
  }, [currentPage, searchTerm, filterRole, filterStatus, debouncedFetch]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const handleVerifyAction = async (userId: string, status: VerificationStatus) => {
    await onVerify(userId, status);
    fetchUsers(currentPage, searchTerm, filterRole, filterStatus);
  };

  const openModal = (type: 'image' | 'video', url: string) => {
    setModalContent({ type, url });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[300px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none pr-10"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.SENDER}>Senders</option>
            <option value={UserRole.PICKER}>Pickers</option>
            <option value={UserRole.ADMIN}>Admins</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none pr-10"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value="ALL">All Verification Status</option>
            <option value={VerificationStatus.UNVERIFIED}>Unverified</option>
            <option value={VerificationStatus.PENDING}>Pending</option>
            <option value={VerificationStatus.VERIFIED}>Verified</option>
          </select>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {totalRecords} Active Records
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-6 text-center w-16">#</th>
                <th className="px-8 py-6">Identity & Digital Footprint</th>
                <th className="px-8 py-6">Privilege Group</th>
                <th className="px-8 py-6">Security Clearance</th>
                <th className="px-8 py-6 text-center">Protocol Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest text-sm">Synchronizing Database...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No records matching system queries</td>
                </tr>
              ) : (
                users.map((u, index) => {
                  const isExpanded = expandedUserId === u.id;
                  const isPicker = u.role === UserRole.PICKER;
                  const isPending = u.verificationStatus === VerificationStatus.PENDING;

                  return (
                    <React.Fragment key={u.id}>
                      <tr className={`transition-all ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[10px] font-mono font-bold text-slate-300">{(currentPage - 1) * 15 + index + 1}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            <div className="relative group">
                              <img src={u.avatar} className="w-12 h-12 rounded-2xl mr-4 border-2 border-white shadow-md object-cover" alt="" />
                              {u.isEmailVerified && (
                                <div className="absolute -top-1 -right-1 bg-green-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm leading-tight">{u.firstName} {u.lastName}</p>
                              <p className="text-[11px] font-medium text-slate-500 mt-1">{u.email}</p>
                              <p className="text-[9px] font-mono text-slate-300 mt-0.5">UID: {u.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white border-slate-900' :
                            u.role === UserRole.PICKER ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-green-50 text-[#009E49] border-green-100' :
                            u.verificationStatus === VerificationStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {u.verificationStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleUserExpand(u.id)}
                              className={`p-2.5 rounded-xl border transition-all ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                            >
                              <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div className="relative">
                              <select
                                value={u.verificationStatus}
                                onChange={(e) => handleVerifyAction(u.id, e.target.value as VerificationStatus)}
                                className="pl-3 pr-8 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all cursor-pointer focus:ring-2 focus:ring-indigo-600 border-none appearance-none"
                              >
                                <option value={VerificationStatus.UNVERIFIED}>Revoke</option>
                                <option value={VerificationStatus.PENDING}>Pending</option>
                                <option value={VerificationStatus.VERIFIED}>Verify</option>
                              </select>
                              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-8 py-10 bg-slate-50 border-x-4 border-indigo-600/20 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                              {/* Document Artifacts */}
                              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Identity Artifacts
                                </h4>
                                <div className="space-y-4">
                                  {u.idFrontUrl ? (
                                    <div className="group relative cursor-pointer" onClick={() => openModal('image', u.idFrontUrl!)}>
                                      <img src={u.idFrontUrl} className="w-full h-40 object-cover rounded-2xl border-2 border-slate-100" alt="ID Front" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-4">Click to Inspect Artifact</div>
                                      <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Primary Document (Front)</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                      <span className="text-[10px] font-black text-slate-400 uppercase">No Front Scan</span>
                                    </div>
                                  )}
                                  {u.idBackUrl ? (
                                    <div className="group relative cursor-pointer" onClick={() => openModal('image', u.idBackUrl!)}>
                                      <img src={u.idBackUrl} className="w-full h-40 object-cover rounded-2xl border-2 border-slate-100" alt="ID Back" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-4">Click to Inspect Artifact</div>
                                      <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Primary Document (Back)</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                      <span className="text-[10px] font-black text-slate-400 uppercase">No Back Scan</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Biometric Verification */}
                              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 7r4 4m0 0l-4 4m4-4H3m18 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Biometric Streams
                                </h4>
                                <div className="space-y-4">
                                  {u.selfieUrl ? (
                                    <div className="group relative cursor-pointer" onClick={() => openModal('image', u.selfieUrl!)}>
                                      <img src={u.selfieUrl} className="w-full h-40 object-cover rounded-2xl border-2 border-slate-100" alt="Selfie" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-4">Verify Identity</div>
                                      <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Headshot</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                      <span className="text-[10px] font-black text-slate-400 uppercase">No Face Data</span>
                                    </div>
                                  )}
                                  {u.livenessVideo ? (
                                    <div className="group relative cursor-pointer" onClick={() => openModal('video', u.livenessVideo!)}>
                                      <video src={u.livenessVideo} className="w-full h-40 object-cover rounded-2xl border-2 border-slate-100" />
                                      <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-4">Execute Playback</div>
                                      <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Liveness Stream</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                      <span className="text-[10px] font-black text-slate-400 uppercase">No Video Feed</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Metadata Overview */}
                              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Registry Intelligence
                                </h4>
                                <div className="space-y-3 flex-1">
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID Classification</span>
                                    <span className="text-xs font-black text-slate-900">{u.idType || 'UNSPECIFIED'}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Serial Content</span>
                                    <span className="text-xs font-black text-slate-900">{u.nationalId || u.passportNumber || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Jurisdiction</span>
                                    <span className="text-xs font-black text-slate-900">{u.issuanceCountry || 'PHASE 1 (GLOBAL)'}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Registered On</span>
                                    <span className="text-xs font-black text-slate-900">{u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'LEGACY'}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Address Node</span>
                                    <span className="text-xs font-black text-slate-900 truncate max-w-[150px]">{u.homeAddress || 'NO ADDRESS PROVIDED'}</span>
                                  </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                  {u.verificationStatus !== VerificationStatus.VERIFIED && (
                                    <button
                                      onClick={() => handleVerifyAction(u.id, VerificationStatus.VERIFIED)}
                                      className="flex-1 py-4 bg-[#009E49] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#007A38] shadow-xl shadow-green-900/10 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                      Approve Proof
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleVerifyAction(u.id, VerificationStatus.UNVERIFIED)}
                                    className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 shadow-xl shadow-red-900/10 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    Deny Proof
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 bg-white w-fit mx-auto p-2 rounded-[2rem] shadow-xl border border-slate-100">
          <button
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all rounded-2xl hover:bg-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Only show limited pages if too many
              if (totalPages > 7) {
                if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="text-slate-300">...</span>;
                  return null;
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all rounded-2xl hover:bg-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Media Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={closeModal}>
          <div className="relative max-w-6xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute -top-10 -right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[1001]"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {modalContent.type === 'image' ? (
              <img src={modalContent.url} className="max-w-full max-h-[80vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(79,70,229,0.3)] border-4 border-white/10 object-contain animate-in zoom-in duration-300" alt="Enlarged Artifact" />
            ) : (
              <video src={modalContent.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(79,70,229,0.3)] border-4 border-white/10 animate-in zoom-in duration-300" />
            )}
            <div className="mt-8 flex items-center gap-4 bg-white/5 px-8 py-3 rounded-full border border-white/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Authorized Security Viewport</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
