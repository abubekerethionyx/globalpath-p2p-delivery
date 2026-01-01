
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, SubscriptionPlan, SubscriptionTransaction } from '../types';
import { SubscriptionService } from '../services/SubscriptionService';
import { useNavigate } from 'react-router-dom';

interface PackagingPageProps {
  user: User | null;
  onPlanChanged: () => void;
}

const PackagingPage: React.FC<PackagingPageProps> = ({ user, onPlanChanged }) => {
  const navigate = useNavigate();
  const [viewRole, setViewRole] = useState<UserRole>(user?.role === UserRole.ADMIN ? UserRole.SENDER : (user?.role || UserRole.SENDER));
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'direct' | 'chapa' | null>(null);
  const [txnRef, setTxnRef] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      setViewRole(user.role);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, txData] = await Promise.all([
          SubscriptionService.getPlans(),
          user ? SubscriptionService.getUserTransactions(user.id) : Promise.resolve([])
        ]);
        setAllPlans(plansData);
        setTransactions(txData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeSubscription = useMemo(() => {
    return transactions.find(t => t.is_active);
  }, [transactions]);

  const currentPlan = useMemo(() => {
    if (!user?.currentPlanId) return null;
    return allPlans.find(p => p.id === user.currentPlanId);
  }, [allPlans, user]);

  const plans = allPlans.filter(p => p.role === viewRole);

  const handleSubmitPayment = async () => {
    if (!user || !selectedPlan || !paymentMethod) return;

    if (paymentMethod !== 'chapa' && !txnRef) {
      alert("Please enter the Transaction Reference Number");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('plan_id', selectedPlan.id);
      formData.append('plan_name', selectedPlan.name);
      formData.append('amount', selectedPlan.price.toString());
      formData.append('payment_method', paymentMethod);
      formData.append('transaction_reference', txnRef);
      formData.append('status', 'PENDING');

      if (receipt) {
        formData.append('receipt', receipt);
      }

      const response = await SubscriptionService.createTransaction(formData as any);

      if (response.payment_info?.paymentUrl) {
        window.location.href = response.payment_info.paymentUrl;
        return;
      }

      const status = response.status || 'PENDING';
      if (status === 'COMPLETED') {
        alert("Subscription Activated Successfully!");
      } else {
        alert(`Payment Submitted! Status: PENDING Verification. \nRef: ${txnRef}`);
      }

      setShowCheckout(false);
      setPaymentMethod(null);
      setTxnRef('');
      setReceipt(null);
      onPlanChanged();

      // Refresh transactions
      const txData = await SubscriptionService.getUserTransactions(user.id);
      setTransactions(txData);
    } catch (e) {
      console.error(e);
      alert("Payment submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#009E49] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading membership tiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in py-12 w-full max-w-7xl mx-auto px-4">

      {/* Active Subscription Overview */}
      {user && currentPlan && (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#009E49]/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-[#009E49]/20 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            {/* Plan Info */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#009E49] text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Active Node: {currentPlan.name}
              </div>
              <h2 className="text-4xl font-black tracking-tight">Current Subscription Overview</h2>
              <p className="text-slate-400 font-medium max-w-md">Your node is fully operational with premium logistics bandwidth enabled.</p>

              <div className="flex flex-wrap gap-8 pt-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                  <p className="text-xl font-black text-[#009E49]">Operational</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Expiry Date</p>
                  <p className="text-xl font-black">
                    {activeSubscription?.end_date ? new Date(activeSubscription.end_date).toLocaleDateString() : 'Lifetime'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Billing Period</p>
                  <p className="text-xl font-black">Monthly Cycle</p>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="w-full lg:w-80 space-y-6">
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Usage</p>
                  <p className="text-sm font-black">{user.itemsCountThisMonth} / {currentPlan.limit}</p>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#009E49] to-[#FDD100] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (user.itemsCountThisMonth / currentPlan.limit) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-4 text-center italic uppercase">
                  {currentPlan.limit - user.itemsCountThisMonth} shipments remaining this cycle
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        {!activeSubscription && (
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl shadow-slate-200">
            Membership Protocol
          </div>
        )}
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
          {activeSubscription ? 'Scale' : 'Unlock'} <span className="text-[#009E49]">Global</span><br />Capabilities.
        </h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
          {user
            ? `Select the tier that matches your ${user.role === UserRole.SENDER ? 'shipping' : 'p2p logistics'} volume.`
            : "Choose the path that fits your global shipping or travel needs."
          }
        </p>

        {(!user || user.role === UserRole.ADMIN) && (
          <div className="flex items-center justify-center pt-8">
            <div className="bg-white p-2 rounded-[1.5rem] flex gap-2 border border-slate-200 shadow-xl shadow-slate-100">
              <button
                onClick={() => setViewRole(UserRole.SENDER)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewRole === UserRole.SENDER ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 bg-slate-50'}`}
              >
                For Senders
              </button>
              <button
                onClick={() => setViewRole(UserRole.PICKER)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewRole === UserRole.PICKER ? 'bg-[#009E49] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 bg-slate-50'}`}
              >
                For Partners
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          // Check if this specific plan is active and has usage/time left
          const activeTx = transactions.find(t =>
            t.plan_id === plan.id &&
            t.is_active &&
            t.remaining_usage > 0 &&
            (!t.end_date || new Date(t.end_date) > new Date())
          );

          const isPlanActive = !!activeTx;

          // Check if there is a pending transaction for this plan
          const isPlanPending = transactions.some(t => t.plan_id === plan.id && t.status === 'PENDING');

          // Check if USER has any OTHER active subscription that isn't expired/finished
          const hasOtherActive = transactions.some(t =>
            t.plan_id !== plan.id &&
            t.is_active &&
            t.remaining_usage > 0 &&
            (!t.end_date || new Date(t.end_date) > new Date())
          );

          const isRecommended = index === 1;

          return (
            <div
              key={plan.id}
              className={`relative rounded-[2.5rem] p-8 flex flex-col group transition-all duration-500 border-2 ${isPlanActive
                ? 'bg-white border-[#009E49] shadow-2xl scale-105 z-10'
                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl'
                }`}
            >
              {isPlanActive && (
                <div className="absolute top-6 right-6 bg-[#009E49] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse">
                  Plan Active
                </div>
              )}
              {isPlanPending && (
                <div className="absolute top-6 right-6 bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  Pending Verification
                </div>
              )}
              {!isPlanActive && !isPlanPending && isRecommended && (
                <div className="absolute top-6 right-6 bg-[#FDD100] text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                  Recommended
                </div>
              )}

              <div className="mb-10 mt-4">
                <p className={`text-[9.5px] font-black uppercase tracking-[0.3em] mb-3 ${isPlanActive ? 'text-[#009E49]' : 'text-slate-400'}`}>
                  {viewRole} {plan.name} Tier
                </p>
                <h3 className="text-3xl font-black text-slate-900 mb-4">
                  {plan.name}
                </h3>
                <p className="font-medium text-sm leading-relaxed text-slate-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex items-baseline">
                <span className="text-5xl font-black tracking-tight text-slate-900">
                  {plan.price.toLocaleString()}
                </span>
                <span className="ml-3 font-bold text-xs uppercase tracking-widest text-slate-400">
                  ETB / MO
                </span>
              </div>

              {isPlanActive && activeTx && (
                <div className="mb-8 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-[#009E49] uppercase tracking-widest">Protocol Usage</span>
                    <span className="text-[10px] font-bold text-slate-400">{activeTx.remaining_usage} slots left</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#009E49]"
                      style={{ width: `${(activeTx.remaining_usage / plan.limit) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="h-px w-full mb-10 bg-slate-100" />

              <ul className="space-y-4 mb-12 flex-1">
                {[
                  `${plan.limit} Active Slots`,
                  'Diaspora Trust Badge',
                  'Priority Visibility',
                  '24/7 Customs Support',
                  'Advanced Analytics'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 bg-green-50 text-[#009E49]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else if (!isPlanActive && !isPlanPending && !hasOtherActive) {
                    setSelectedPlan(plan);
                    setShowCheckout(true);
                  } else if (hasOtherActive) {
                    alert("You already have an active subscription for another plan. Please wait for it to expire or finish usage before switching.");
                  }
                }}
                disabled={isPlanActive || isPlanPending || (hasOtherActive && !isPlanActive)}
                className={`w-full py-5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 ${isPlanActive
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                  : isPlanPending
                    ? 'bg-amber-50 text-amber-600 cursor-not-allowed border border-amber-200'
                    : hasOtherActive
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-dashed border-slate-200'
                      : plan.price > 0
                        ? 'bg-slate-900 text-white hover:bg-black shadow-lg hover:shadow-xl'
                        : 'bg-[#009E49] text-white hover:bg-[#007A38] shadow-lg shadow-green-100'
                  }`}
              >
                {isPlanActive ? 'Already Subscribed' : isPlanPending ? 'Verifying Payment' : hasOtherActive ? 'Current Node Occupied' : user ? (plan.price > 0 ? 'Activate Plan' : 'Select Free') : 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Transaction History Section */}
      {user && transactions.length > 0 && (
        <div className="space-y-8 pt-12">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#009E49] mb-1">Financial Logs</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Billing History</h3>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              View Full Statement →
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Transferred Plan</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Method</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Reference</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.slice(0, 5).map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900">{tx.plan_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1 rounded-lg text-slate-600">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-xs font-mono text-slate-400">{tx.transaction_reference || 'N/A'}</code>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900">{tx.amount.toLocaleString()} ETB</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-[#009E49]/5" />

            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:scale-110 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="relative text-center mb-10 mt-4">
              <div className="w-20 h-20 bg-[#009E49]/10 rounded-3xl flex items-center justify-center text-[#009E49] mx-auto mb-6 rotate-3">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900">Secure Protocol</h3>
              <p className="text-slate-500 font-medium mt-2">Allocating resources for <span className="text-[#009E49] font-bold">{selectedPlan.name}</span></p>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] mb-8 flex justify-between items-center border border-slate-100">
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Billing Amount</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-black text-slate-900">{selectedPlan.price.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ETB</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 mx-4"></div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Resources</p>
                <p className="text-sm font-black text-slate-900">{selectedPlan.limit} Active Slots</p>
              </div>
            </div>

            {!paymentMethod ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-2">Authorize Payment Channel</p>

                <button
                  onClick={() => setPaymentMethod('chapa')}
                  className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-green-600 hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-900 text-white rounded-2xl flex items-center justify-center mr-4 font-black text-[10px]">
                      CHAPA
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900">Pay with Chapa</p>
                      <p className="text-xs font-bold text-slate-400">Cards & Mobile Money</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('direct')}
                  className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-slate-900 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mr-4 text-slate-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900">Direct Bank Transfer</p>
                      <p className="text-xs font-bold text-slate-400">Manual ID Verification</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <button onClick={() => setPaymentMethod(null)} className="text-xs text-slate-400 font-bold mb-4 hover:text-slate-600 flex items-center gap-1">
                  ← Back to Channels
                </button>

                {paymentMethod === 'chapa' ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    <p className="font-bold text-slate-700 mb-2">Authorize Chapa Node</p>
                    <p className="text-xs text-slate-500">You will be securely redirected to finalize the transaction flow.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-900 p-6 rounded-2xl text-white mb-6 space-y-4">
                      <div className="border-b border-white/10 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#009E49] mb-2">Dashen Bank</p>
                        <p className="text-lg font-black tracking-tight">Acc: 1002345678901</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FDD100] mb-2">Bank of Abyssinia</p>
                        <p className="text-lg font-black tracking-tight">Acc: 7788990011</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 uppercase border-t border-white/10 pt-4">GlobalPath Logistics PLC</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Bank Reference / ID</label>
                      <input
                        type="text"
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-[#009E49]"
                        placeholder="Enter 12-digit Ref Code"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitPayment}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#009E49] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#007A38] disabled:opacity-50 mt-4 shadow-xl shadow-green-900/10"
                >
                  {isSubmitting ? 'Verifying Transmission...' : 'Execute Activation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingPage;
