
import React, { useState, useEffect } from 'react';
import { SubscriptionTransaction, User } from '../../types';
import { SubscriptionService } from '../../services/SubscriptionService';
import { UserService } from '../../services/UserService';

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
    return user ? user.name : `User (${userId.slice(0, 8)})`;
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

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition duration-200">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{getUserName(tx.user_id)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {tx.plan_name} • {tx.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-start gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {ref || 'No Ref'}
                          </span>
                          {receiptUrl && (
                            <a
                              href={`http://localhost:5000${receiptUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-black text-[#009E49] uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              View Receipt
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{date.toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
