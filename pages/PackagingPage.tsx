
import React, { useState, useEffect } from 'react';
import { User, UserRole, SubscriptionPlan } from '../types';
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
  const [loading, setLoading] = useState(true);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'direct' | 'chapa' | null>(null);
  const [txnRef, setTxnRef] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      setViewRole(user.role);
    }
  }, [user]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await SubscriptionService.getPlans();
        setAllPlans(data);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const plans = allPlans.filter(p => p.role === viewRole);

  const handleSubmitPayment = async () => {
    if (!user || !selectedPlan || !paymentMethod) return;

    // Validation: TxnRef required for Manual methods (Wallet/Telebirr P2P, Direct)
    // Chapa is automated, so no TxnRef needed from user initially.
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

      // Status: Telebirr might be auto-completed in real API, but for P2P/Direct it's Pending
      // If User provides Ref, we assume they paid.
      formData.append('status', 'PENDING');

      if (receipt) {
        formData.append('receipt', receipt);
      }

      const response = await SubscriptionService.createTransaction(formData as any);

      if (response.payment_info?.paymentUrl) {
        // Redirect to external payment gateway (Chapa/Telebirr)
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
    } catch (e) {
      console.error(e);
      alert("Payment submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in py-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl shadow-slate-200">
          GlobalPath Membership
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
          Unlock <span className="text-[#009E49]">Premium</span><br />Features.
        </h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
          {user
            ? `Upgrade your ${user.role === UserRole.SENDER ? 'Sender' : 'Travel Partner'} capabilities with our tailored subscription tiers.`
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {plans.map((plan, index) => {
          const isCurrent = user?.currentPlanId === plan.id;
          const isRecommended = index === 1; // Middle plan usually recommended

          return (
            <div
              key={plan.id}
              className={`relative rounded-[2.5rem] p-8 flex flex-col group transition-all duration-300 ${isCurrent
                ? 'bg-gradient-to-br from-[#009E49] to-[#007A38] text-white shadow-2xl shadow-green-900/20 scale-105 z-10'
                : 'bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-xl'
                }`}
            >
              {isCurrent && (
                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border border-white/20">
                  Current Plan
                </div>
              )}
              {!isCurrent && isRecommended && (
                <div className="absolute top-6 right-6 bg-[#FDD100] text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                  Recommended
                </div>
              )}

              <div className="mb-10 mt-4">
                <p className={`text-[9.5px] font-black uppercase tracking-[0.3em] mb-3 ${isCurrent ? 'text-green-100' : 'text-slate-400'}`}>
                  {viewRole} Tier {index + 1}
                </p>
                <h3 className={`text-3xl font-black mb-4 ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`font-medium text-sm leading-relaxed ${isCurrent ? 'text-green-50' : 'text-slate-400'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex items-baseline">
                <span className={`text-5xl font-black tracking-tight ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price.toLocaleString()}
                </span>
                <span className={`ml-3 font-bold text-xs uppercase tracking-widest ${isCurrent ? 'text-green-100' : 'text-slate-400'}`}>
                  ETB / MO
                </span>
              </div>

              <div className={`h-px w-full mb-10 ${isCurrent ? 'bg-white/20' : 'bg-slate-100'}`} />

              <ul className="space-y-4 mb-12 flex-1">
                {[
                  `${plan.limit} Active Slots`,
                  'Diaspora Trust Badge',
                  'Priority Visibility',
                  '24/7 Customs Support',
                  'Advanced Analytics'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${isCurrent ? 'bg-white/20 text-white' : 'bg-green-50 text-[#009E49]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button - HIDDEN if Active */}
              {!isCurrent ? (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      setSelectedPlan(plan);
                      setShowCheckout(true);
                    }
                  }}
                  className={`w-full py-5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 ${plan.price > 0
                    ? 'bg-slate-900 text-white hover:bg-black shadow-lg hover:shadow-xl'
                    : 'bg-[#009E49] text-white hover:bg-[#007A38] shadow-lg shadow-green-100'
                    }`}
                >
                  {user ? (plan.price > 0 ? 'Upgrade Now' : 'Select Free') : 'Get Started'}
                </button>
              ) : (
                <div className="w-full py-5 rounded-[1.2rem] bg-white/20 backdrop-blur-sm border border-white/30 text-center">
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Plan Active
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">

            {/* Background Decoration */}
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
              <h3 className="text-3xl font-black text-slate-900">Secure Checkout</h3>
              <p className="text-slate-500 font-medium mt-2">Upgrading to <span className="text-[#009E49] font-bold">{selectedPlan.name}</span></p>
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
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Frequency</p>
                <p className="text-sm font-black text-slate-900">Monthly</p>
              </div>
            </div>

            {!paymentMethod ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-2">Select Payment Method</p>

                {/* Chapa Button */}
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
                  onClick={() => setPaymentMethod('wallet')}
                  className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-[#009E49] hover:bg-green-50/50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4 text-[#009E49]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900">Telebirr Wallet</p>
                      <p className="text-xs font-bold text-slate-400">Enter Transaction ID</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#009E49] group-hover:text-white transition-colors">
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
                      <p className="text-xs font-bold text-slate-400">Manual Verification</p>
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
                  ← Back to Methods
                </button>

                {paymentMethod === 'chapa' ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    <p className="font-bold text-slate-700 mb-2">Proceed with Chapa</p>
                    <p className="text-xs text-slate-500">You will be redirected to complete your secure payment.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Transaction Reference / ID</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-[#009E49]"
                      placeholder={paymentMethod === 'wallet' ? "Enter Telebirr SMS Code (e.g. 8G...)" : "Enter Bank Ref Number"}
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                    />
                  </div>
                )}

                {paymentMethod === 'direct' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Upload Receipt (Optional)</label>
                    <input
                      type="file"
                      className="w-full p-2 bg-slate-50 rounded-2xl text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                      onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmitPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#009E49] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#007A38] disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? 'Verifying...' : 'Confirm Payment'}
                </button>
              </div>
            )}

            <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-8">
              Secured by GlobalPath Protocol
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingPage;
