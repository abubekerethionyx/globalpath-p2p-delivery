
import React, { useState, useEffect } from 'react';
import { SubscriptionTransaction, User } from '../../types';
import { SubscriptionService } from '../../services/SubscriptionService';
import { UserService } from '../../services/UserService';
import { BASE_URL } from '../../config';

interface AdminBillingTabProps {
  users?: User[];
}

const AdminBillingTab: React.FC<AdminBillingTabProps> = ({ users: propsUsers }) => {
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(propsUsers || []);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txs, fetchedUsers] = await Promise.all([
        SubscriptionService.getAllTransactions(),
        propsUsers ? Promise.resolve(propsUsers) : UserService.getAllUsers()
      ]);
      setTransactions(txs);
      if (!propsUsers) setAllUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch billing data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propsUsers) setAllUsers(propsUsers);
  }, [propsUsers]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyPayment = async (txId: string) => {
    setVerifyingId(txId);
    try {
      await SubscriptionService.updateTransactionStatus(txId, 'COMPLETED');
      await fetchData();
      alert("Payment verified and subscription activated!");
    } catch (error) {
      console.error("Failed to verify payment", error);
      alert("Verification failed.");
    } finally {
      setVerifyingId(null);
    }
  };

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Anonymous';
    const user = allUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User (${userId.slice(0, 8)})`;
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-bold">Loading Financial Records...</div>;

  const pendingCount = transactions.filter(t => t.status === 'PENDING').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Verified Revenue</p>
          <p className="text-4xl font-black text-[#009E49] mt-2">
            {totalRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-500 uppercase">ETB</span>
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pending Approvals</p>
          <p className="text-4xl font-black text-amber-500 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Transactions</p>
          <p className="text-4xl font-black text-slate-900 mt-2">{transactions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900">Subscription History</h3>
          <button onClick={fetchData} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition">Refresh List</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">User & Payment</th>
                <th className="px-8 py-6">Ref & Receipt</th>
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6 text-right">Amount</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const receiptUrl = tx.receipt_url;
                  const ref = tx.transaction_reference;
                  const date = new Date(tx.timestamp);
                  const endDate = tx.end_date ? new Date(tx.end_date) : null;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition duration-200">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{getUserName(tx.user_id)}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {tx.plan_name} • {tx.payment_method}
                            </span>
                            {tx.is_active && (
                              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-black rounded uppercase">Active</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${tx.payment_method === 'direct' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {ref || 'No Ref'}
                          </span>
                          {receiptUrl ? (
                            <div className="group relative">
                              <a
                                href={`${BASE_URL}${receiptUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-black text-[#009E49] uppercase tracking-widest hover:underline flex items-center gap-3 p-2 bg-green-50/50 rounded-2xl border border-green-100 transition-all hover:bg-green-50"
                              >
                                <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                  <img
                                    src={`${BASE_URL}${receiptUrl}`}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Receipt';
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-1">
                                    View Proof
                                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  </span>
                                  <span className="text-[8px] opacity-60 font-medium">Click to examine</span>
                                </div>
                              </a>
                            </div>
                          ) : (
                            tx.payment_method === 'direct' ? (
                              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">No Receipt</span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-300 uppercase italic">Digital Auto-Ref</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">Issued: {date.toLocaleDateString()}</span>
                          {endDate && (
                            <span className="text-[10px] text-slate-400 font-medium">Expires: {endDate.toLocaleDateString()}</span>
                          )}
                          <span className="text-[9px] text-indigo-500 font-black uppercase mt-1">
                            Usage: {tx.remaining_usage} Slots
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black text-slate-900">{tx.amount.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {tx.status === 'PENDING' ? (
                          <button
                            onClick={() => handleVerifyPayment(tx.id)}
                            disabled={verifyingId === tx.id}
                            className="px-4 py-2 bg-[#009E49] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#007A38] shadow-lg shadow-green-100 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                          >
                            {verifyingId === tx.id ? 'Verifying...' : 'Verify Now'}
                          </button>
                        ) : tx.status === 'REJECTED' ? (
                          <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-100">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-green-50 text-[#009E49] text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBillingTab;
