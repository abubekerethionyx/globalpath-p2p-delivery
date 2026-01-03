
import React, { useState, useEffect, useCallback } from 'react';
import { SubscriptionService } from '../../services/SubscriptionService';
import { User, SubscriptionTransaction } from '../../types';
import { debounce } from 'lodash';

interface AdminBillingTabProps {
  users?: User[]; // Optional prop if we want to pass users
}

const AdminBillingTab: React.FC<AdminBillingTabProps> = ({ users: propsUsers }) => {
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async (page: number, status: string, method: string, search: string) => {
    setLoading(true);
    try {
      const response = await SubscriptionService.getAllTransactions({
        page,
        per_page: 20,
        status: status === 'ALL' ? undefined : status,
        payment_method: method === 'ALL' ? undefined : method,
        search
      });
      setTransactions(response.transactions);
      setTotalPages(response.pages);
      setTotalRecords(response.total);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error("Failed to fetch billing data", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((page, status, method, search) => {
      fetchTransactions(page, status, method, search);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedFetch(currentPage, filterStatus, filterMethod, searchTerm);
  }, [currentPage, filterStatus, filterMethod, searchTerm, debouncedFetch]);

  const handleUpdateStatus = async (txId: string, status: string) => {
    try {
      if (status === 'COMPLETED' && !window.confirm("Verify: Confirm successful receipt of funds? This will activate the user's subscription.")) return;
      if (status === 'REJECTED' && !window.confirm("Verify: Reject this transaction? This will invalidate the payment attempt.")) return;

      await SubscriptionService.updateTransactionStatus(txId, status);
      fetchTransactions(currentPage, filterStatus, filterMethod, searchTerm);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-[#009E49] border-green-200';
      case 'PENDING': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'REJECTED': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Volume</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalRecords} <span className="text-xs font-bold text-slate-400">TXS</span></p>
        </div>
        {/* Add more stats if needed by aggregating locally or fetching summary endpoint */}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[300px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search ref, user, or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={filterMethod}
            onChange={(e) => { setFilterMethod(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Methods</option>
            <option value="telebirr">Telebirr</option>
            <option value="cbe">CBE Transfer</option>
            <option value="boa">BOA Transfer</option>
            <option value="chapa">Chapa Gateway</option>
            <option value="coins">System Credits</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchTransactions(currentPage, filterStatus, filterMethod, searchTerm)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-6">Transaction Ref</th>
                <th className="px-8 py-6">User Identity</th>
                <th className="px-8 py-6">Financials</th>
                <th className="px-8 py-6">Method & Proof</th>
                <th className="px-8 py-6">Status & Validity</th>
                <th className="px-8 py-6 text-center">Protocol Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {loading && transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest text-sm">Syncing Ledger...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No transaction records found</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => copyToClipboard(tx.transaction_reference)}>
                        <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tx.transaction_reference}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.timestamp).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {/* If we have user info populated by API join later, great. For now, assuming tx might have user_id and we rely on propsUsers lookup or minimal data if backend sends none. 
                              Since backend search joins User, it implies we might want User info in TX response. 
                              Assuming TX response from backend currently only has user_id. 
                              However, our updated getAllTransactions filters by User fields but returns Transaction objects which usually don't nest User unless schema modified.
                              For MVP, we display User ID if name not avail, or fetch user properly. 
                              Wait, updated backend join does filter but doesn't explicitly modify return schema to include User details if they weren't matched in schema.
                              Let's assume standard Schema dump.
                           */}
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">UID: {tx.userId?.slice(0, 8)}</span>
                        {/* Ideally backend should return user name/email flattened or nested */}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#009E49]">{tx.amount.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan ID: {tx.planId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border w-fit ${tx.paymentMethod === 'chapa' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {tx.paymentMethod}
                          </span>
                        </div>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => setModalImage(tx.receiptUrl!)}
                            className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            title="View Receipt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                        {tx.isActive ? (
                          <span className="text-[9px] font-bold text-[#009E49] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009E49]"></span> Active Sub
                          </span>
                        ) : tx.status === 'COMPLETED' ? (
                          <span className="text-[9px] font-bold text-slate-400">Inactive/Expired</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {tx.status === 'PENDING' && (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleUpdateStatus(tx.id, 'COMPLETED')} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => handleUpdateStatus(tx.id, 'REJECTED')} className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                      {tx.status !== 'PENDING' && (
                        <div className="relative inline-block group">
                          <select
                            value={tx.status}
                            onChange={(e) => handleUpdateStatus(tx.id, e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                          >
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Reject</option>
                            <option value="PENDING">Pending</option>
                          </select>
                          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 bg-white w-fit mx-auto p-2 rounded-[2rem] shadow-xl border border-slate-100">
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

      {modalImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in" onClick={() => setModalImage(null)}>
          <img src={modalImage} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white" alt="Receipt" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AdminBillingTab;
