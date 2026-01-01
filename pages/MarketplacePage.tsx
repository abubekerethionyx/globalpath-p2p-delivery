
import React, { useState, useMemo, useEffect } from 'react';
import { ShipmentItem, User, ItemStatus, VerificationStatus, SubscriptionPlan, SubscriptionTransaction } from '../types';
import { SubscriptionService } from '../services/SubscriptionService';
import { COUNTRIES, CATEGORIES } from '../constants';
import ShipmentCard from '../components/ShipmentCard';
import { ShipmentService } from '../services/ShipmentService';
import { useNavigate } from 'react-router-dom';

interface MarketplacePageProps {
  user: User;
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<SubscriptionTransaction | null>(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showPendingModal, setShowPendingModal] = useState(false);

  const fetchItems = async () => {
    try {
      const allItems = await ShipmentService.getAllShipments();
      setItems(allItems);
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch shipments", e);
    }
  };

  useEffect(() => {
    fetchItems();
    const loadData = async () => {
      try {
        const [fetchedPlans, txs] = await Promise.all([
          SubscriptionService.getPlans(),
          SubscriptionService.getUserTransactions(user.id)
        ]);
        setPlans(fetchedPlans);
        const active = txs.find(t => t.is_active);
        setActiveSub(active || null);
      } catch (e) {
        console.error("Failed to fetch data", e);
      }
    };
    loadData();
  }, [user.id]);

  const isVerified = user.verificationStatus === VerificationStatus.VERIFIED;
  const isPending = user.verificationStatus === VerificationStatus.PENDING;
  const isUnverified = user.verificationStatus === VerificationStatus.UNVERIFIED;
  const hasPaid = user.currentPlanId !== 's-free' && user.currentPlanId !== 'p-free';

  const currentPlan = plans.find(p => p.id === user.currentPlanId);
  const planLimit = currentPlan ? currentPlan.limit : 0;
  const remainingPicks = activeSub?.remaining_usage ?? 0;

  const availableItems = useMemo(() => {
    return items.filter(i =>
      i.status === ItemStatus.POSTED &&
      (!from || i.pickupCountry === from) &&
      (!to || i.destCountry === to) &&
      (activeCategory === 'All' || i.category === activeCategory) &&
      (i.category?.toLowerCase().includes(search.toLowerCase()) ||
        i.address.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [items, search, from, to, activeCategory]);

  const handlePickAttempt = async (id: string) => {
    // 1. Check Verification (Optional for now)
    // if (isUnverified) {
    //   navigate('/registration');
    //   return;
    // }

    if (isPending) {
      setShowPendingModal(true);
      return;
    }

    // 2. Check Subscription - DISABLED PER USER REQUEST to allow detail viewing
    // if (!hasPaid) {
    //   alert("Detail View & Pick actions are locked. Please upgrade your plan to access this item.");
    //   navigate('/packaging');
    //   return;
    // }

    // 3. Check Quota
    if (remainingPicks <= 0) {
      alert("Monthly Quota Exceeded! You have reached the limit of your current subscription. Please upgrade your plan to accept more deliveries.");
      navigate('/packaging');
      return;
    }

    try {
      await ShipmentService.pickShipment(id);
      alert("You have requested to pick this shipment! The sender will be notified.");
      fetchItems();
    } catch (e) {
      alert("Failed to pick shipment. It might be already taken.");
      fetchItems();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#009E49] rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Marketplace Hub</h2>
          </div>
          <p className="text-slate-500 font-medium text-lg">Browse and claim international shipments from the global network.</p>

          {user.role === 'PICKER' && (
            <div className="mt-6 inline-flex items-center bg-white border border-slate-200 p-2 pr-6 rounded-2xl shadow-sm gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg ${remainingPicks > 0 ? 'bg-[#009E49]' : 'bg-red-500'}`}>
                {remainingPicks}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Quota</p>
                <p className="text-sm font-bold text-slate-900">{remainingPicks} <span className="text-slate-400 font-medium">of {planLimit} Remaining</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {(!hasPaid) && (
            <button
              onClick={() => navigate('/packaging')}
              className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl text-amber-700 text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Limited Access
            </button>
          )}
          <div className="bg-slate-900 px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-100 flex items-center">
            {availableItems.length} Open Shipments
          </div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-2xl flex flex-col lg:flex-row gap-2">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search items, descriptions, or locations..."
            className="w-full pl-14 pr-6 py-5 bg-transparent rounded-[2rem] text-sm font-bold focus:ring-0 focus:outline-none placeholder:text-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="h-10 w-px bg-slate-100 hidden lg:block self-center"></div>
        <div className="flex flex-col sm:flex-row gap-2 p-2 lg:p-0">
          <select
            className="px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#009E49] cursor-pointer"
            value={from}
            onChange={e => setFrom(e.target.value)}
          >
            <option value="">Origin: All</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#009E49] cursor-pointer"
            value={to}
            onChange={e => setTo(e.target.value)}
          >
            <option value="">Dest: All</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
        >
          All Nodes
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#009E49] text-white shadow-xl shadow-green-100' : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
          >
            {cat.split('/')[0]}
          </button>
        ))}
      </div>

      <div className="relative">
        {availableItems.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-slate-400 text-lg font-bold">No operational nodes match your query.</p>
            <button onClick={() => { setSearch(''); setFrom(''); setTo(''); setActiveCategory('All'); }} className="text-[#009E49] font-black uppercase text-xs tracking-widest mt-4 hover:border-b-2 border-[#009E49]">Reset Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {availableItems.map(item => (
              <div key={item.id} className="relative">
                <ShipmentCard item={item} role={user.role} onPick={handlePickAttempt} />
                {(!hasPaid) && (
                  <div className="absolute top-14 right-4 bg-slate-900/10 p-2 rounded-xl backdrop-blur-md border border-white/20 z-10">
                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Pending Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-600">
              <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Node Verification in Progress</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Security protocols are currently validating your identification artifacts. This usually takes <strong className="text-slate-900">24 hours</strong>. We will notify you once clearance is granted.
            </p>
            <button
              onClick={() => setShowPendingModal(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition shadow-xl shadow-slate-100"
            >
              Acknowledge & Sync
            </button>
          </div>
        </div>
      )}

      {/* Platform Note - Only shown for Unverified Users */}
      {isUnverified && (
        <div className="mt-20 p-12 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-3xl font-black tracking-tight">Escalate Your Privileges</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              GlobalPath verified partners earn an average of <strong>12,000 ETB</strong> per month. Complete your identity registry to unlock premium routes and high-value cargo.
            </p>
          </div>
          <button
            onClick={() => navigate('/registration')}
            className="px-12 py-6 bg-[#009E49] text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-green-900/20 hover:scale-105 transition-transform whitespace-nowrap"
          >
            Start Identity Registry
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
