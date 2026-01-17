
import React, { useState, useEffect, useCallback } from 'react';
import { User, VerificationStatus, UserRole } from '../../types';
import { UserService } from '../../services/UserService';
import { debounce } from 'lodash';

interface AdminUsersTabProps {
  onVerify: (userId: string, status: VerificationStatus, reason?: string) => void;
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
    let reason = undefined;
    if (status === VerificationStatus.REJECTED) {
      reason = window.prompt("Enter rejection reason (this will be sent as a notification):");
      if (reason === null) return; // Cancelled
    }
    await onVerify(userId, status, reason);
    fetchUsers(currentPage, searchTerm, filterRole, filterStatus);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await UserService.updateUser(userId, { role: newRole } as any);
      fetchUsers(currentPage, searchTerm, filterRole, filterStatus);
    } catch (error) {
      console.error("Failed to update user role", error);
    }
  };

  const openModal = (type: 'image' | 'video', url: string) => {
    setModalContent({ type, url });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Verified</span>;
      case VerificationStatus.PENDING:
        return <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Pending Review</span>;
      case VerificationStatus.REJECTED:
        return <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Rejected</span>;
      default:
        return <span className="bg-slate-50 text-slate-400 border border-slate-100 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Unverified</span>;
    }
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
              placeholder="Query Identity Database..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-300"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
            className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-600 appearance-none pr-12 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.SENDER}>Senders</option>
            <option value={UserRole.PICKER}>Pickers</option>
            <option value={UserRole.ADMIN}>Admins</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-600 appearance-none pr-12 cursor-pointer"
          >
            <option value="ALL">All Clearances</option>
            <option value={VerificationStatus.UNVERIFIED}>Unverified</option>
            <option value={VerificationStatus.PENDING}>Pending</option>
            <option value={VerificationStatus.VERIFIED}>Verified</option>
            <option value={VerificationStatus.REJECTED}>Rejected</option>
          </select>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
          Registry Load: {totalRecords} Units
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-5 text-center w-16">#</th>
                <th className="px-8 py-5">Identity Profile</th>
                <th className="px-8 py-5">Dynamic Role</th>
                <th className="px-8 py-5">Verification Status</th>
                <th className="px-8 py-5 text-center">System Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Decrypting Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No records matching system queries</td>
                </tr>
              ) : (
                users.map((u, index) => {
                  const isExpanded = expandedUserId === u.id;

                  return (
                    <React.Fragment key={u.id}>
                      <tr className={`transition-all duration-300 ${isExpanded ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-100' : 'hover:bg-slate-50/30'}`}>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[10px] font-mono font-bold text-slate-300">{(currentPage - 1) * 15 + index + 1}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            <div className="relative group">
                              <img src={u.avatar} className="w-11 h-11 rounded-[1.2rem] mr-4 border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform" alt="" />
                              {u.isEmailVerified && (
                                <div className="absolute -top-1 -right-0 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm tracking-tight">{u.firstName} {u.lastName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-medium text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-600 cursor-pointer appearance-none pr-8 bg-transparent ${u.role === UserRole.ADMIN ? 'text-indigo-900 bg-indigo-50' :
                              u.role === UserRole.PICKER ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-50'
                              }`}
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.8rem' }}
                          >
                            <option value={UserRole.SENDER}>Sender</option>
                            <option value={UserRole.PICKER}>Picker</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          {getStatusBadge(u.verificationStatus)}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => toggleUserExpand(u.id)}
                              className={`p-2.5 rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-110' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'}`}
                            >
                              <svg className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {/* Fast Action Buttons Based on Status */}
                            <div className="flex items-center gap-1.5">
                              {u.verificationStatus === VerificationStatus.PENDING && (
                                <>
                                  <button
                                    onClick={() => handleVerifyAction(u.id, VerificationStatus.VERIFIED)}
                                    className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-90"
                                    title="Verify User"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                  </button>
                                  <button
                                    onClick={() => handleVerifyAction(u.id, VerificationStatus.REJECTED)}
                                    className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-90"
                                    title="Reject Verification"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </>
                              )}
                              {u.verificationStatus === VerificationStatus.VERIFIED && (
                                <button
                                  onClick={() => handleVerifyAction(u.id, VerificationStatus.UNVERIFIED)}
                                  className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-90"
                                  title="Revoke Verification"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </button>
                              )}
                              {(u.verificationStatus === VerificationStatus.UNVERIFIED || u.verificationStatus === VerificationStatus.REJECTED) && (
                                <button
                                  onClick={() => handleVerifyAction(u.id, VerificationStatus.PENDING)}
                                  className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-all active:scale-90"
                                  title="Move to Pending"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-8 py-10 bg-slate-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                              {/* Document Artifacts */}
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Primary Evidence
                                </h4>
                                <div className="space-y-4">
                                  {u.idFrontUrl ? (
                                    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-50" onClick={() => openModal('image', u.idFrontUrl!)}>
                                      <img src={u.idFrontUrl} className="w-full h-40 object-cover" alt="ID Front" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Inspect Artifact</div>
                                      <p className="mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-2 bg-slate-50">Document Front</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">Void Front Artifact</span>
                                    </div>
                                  )}
                                  {u.idBackUrl ? (
                                    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-50" onClick={() => openModal('image', u.idBackUrl!)}>
                                      <img src={u.idBackUrl} className="w-full h-40 object-cover" alt="ID Back" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Inspect Artifact</div>
                                      <p className="mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-2 bg-slate-50">Document Back</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">Void Back Artifact</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Biometric Verification */}
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 7r4 4m0 0l-4 4m4-4H3m18 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Biometric Registry
                                </h4>
                                <div className="space-y-4">
                                  {u.selfieUrl ? (
                                    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-50" onClick={() => openModal('image', u.selfieUrl!)}>
                                      <img src={u.selfieUrl} className="w-full h-40 object-cover" alt="Selfie" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Verify Headshot</div>
                                      <p className="mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-2 bg-slate-50">Live Portrait</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">No Face Records</span>
                                    </div>
                                  )}
                                  {u.livenessVideo ? (
                                    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-50" onClick={() => openModal('video', u.livenessVideo!)}>
                                      <video src={u.livenessVideo} className="w-full h-40 object-cover" />
                                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Stream Pulse</div>
                                      <p className="mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest text-center py-2 bg-slate-50">Liveness Feed</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">No Motion Data</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Registry Intelligence */}
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Registry Intelligence
                                </h4>
                                <div className="space-y-2 flex-1">
                                  {[
                                    { label: 'Classification', val: u.idType },
                                    { label: 'Serial Hash', val: u.nationalId || u.passportNumber || 'N/A' },
                                    { label: 'Jurisdiction', val: u.issuanceCountry },
                                    { label: 'Birthdate', val: u.dateOfBirth },
                                    { label: 'Onboarded', val: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A' },
                                    { label: 'Location Node', val: u.homeAddress, truncate: true }
                                  ].map((m, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-50">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{m.label}</span>
                                      <span className={`text-[10px] font-black text-slate-900 ${m.truncate ? 'truncate max-w-[120px]' : ''}`}>{m.val || 'VOID'}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                  <button
                                    onClick={() => handleVerifyAction(u.id, VerificationStatus.VERIFIED)}
                                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-100'
                                      }`}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVerifyAction(u.id, VerificationStatus.REJECTED)}
                                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${u.verificationStatus === VerificationStatus.REJECTED ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-100'
                                      }`}
                                  >
                                    Reject
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
        <div className="flex items-center justify-center gap-2 mt-12 bg-white w-fit mx-auto p-1.5 rounded-3xl shadow-xl border border-slate-50">
          <button
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all rounded-2xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`w-10 h-10 rounded-2xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all rounded-2xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Media Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={closeModal}>
          <div className="relative max-w-6xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute -top-12 -right-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {modalContent.type === 'image' ? (
              <img src={modalContent.url} className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl border border-white/10 object-contain animate-in zoom-in duration-300" alt="Artifact" />
            ) : (
              <video src={modalContent.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl border border-white/10 animate-in zoom-in duration-300" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
