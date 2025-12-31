import React, { useState, useEffect, useMemo } from 'react';
import { User, ShipmentItem, UserRole, ItemStatus, SubscriptionTransaction } from '../types';
import { ShipmentService } from '../services/ShipmentService';
import { SubscriptionService } from '../services/SubscriptionService';
import { useNavigate } from 'react-router-dom';

interface BillingPageProps {
  user: User;
}

const BillingPage: React.FC<BillingPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'transactions' | 'subscriptions'>('transactions');
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [subs, setSubs] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedItems, fetchedSubs] = await Promise.all([
          ShipmentService.getAllShipments(),
          SubscriptionService.getUserTransactions(user.id)
        ]);
        setItems(fetchedItems);
        setSubs(fetchedSubs);
        setLoading(false);
      } catch (e) {
        console.error("Failed to fetch billing data", e);
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Derived State based on Role
  const isSender = user.role === UserRole.SENDER;
  const isPicker = user.role === UserRole.PICKER;

  // Filter raw data by role
  const myShipments = useMemo(() => {
    return items.filter(i => isSender ? i.senderId === user.id : i.partnerId === user.id);
  }, [items, isSender, user.id]);

  // Computed Filtered Lists
  const displayedData = useMemo(() => {
    let data: (ShipmentItem | SubscriptionTransaction)[] = activeTab === 'transactions' ? myShipments : subs;

    // Date Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0, 0, 0, 0);
      data = data.filter(d => {
        const dateStr = 'createdAt' in d ? d.createdAt : d.timestamp;
        return new Date(dateStr).getTime() >= start;
      });
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
      data = data.filter(d => {
        const dateStr = 'createdAt' in d ? d.createdAt : d.timestamp;
        return new Date(dateStr).getTime() <= end;
      });
    }

    // Status Filter
    if (filterStatus !== 'ALL') {
      data = data.filter(d => d.status === filterStatus);
    }

    // Sort by Date Desc
    return data.sort((a, b) => {
      const dateA = 'createdAt' in a ? a.createdAt : a.timestamp;
      const dateB = 'createdAt' in b ? b.createdAt : b.timestamp;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [activeTab, myShipments, subs, dateRange, filterStatus]);

  // Analytics
  const totalValue = displayedData.reduce((acc, curr) => {
    const val = 'fee' in curr ? curr.fee : curr.amount;
    return acc + val;
  }, 0);

  const averageValue = displayedData.length > 0 ? totalValue / displayedData.length : 0;

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading Financial Ledger...</div>;

  return (
    <div className="space-y-10 animate-in pb-24 w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            {isSender ? 'Expenditure & Invoices' : 'Earnings & Revenue'}
          </h2>
          <p className="text-slate-500 font-medium text-lg">
            {isSender
              ? 'Track your delivery payments and platform subscription fees.'
              : 'Monitor your delivery income and platform overhead.'}
          </p>
        </div>

        {/* Toggle Grid */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex font-bold text-xs uppercase tracking-widest shadow-inner">
          <button
            onClick={() => { setActiveTab('transactions'); setFilterStatus('ALL'); }}
            className={`px-8 py-3 rounded-xl transition-all ${activeTab === 'transactions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            P2P Transactions
          </button>
          <button
            onClick={() => { setActiveTab('subscriptions'); setFilterStatus('ALL'); }}
            className={`px-8 py-3 rounded-xl transition-all ${activeTab === 'subscriptions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Platform Subs
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39h-2.01c-.15-.79-.77-1.55-2.64-1.55-1.98 0-2.72.85-2.72 1.58 0 .86.48 1.52 2.66 2.15 2.58.75 4.2 1.88 4.2 3.63 0 1.94-1.51 3.09-3.28 3.54z" /></svg>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            {activeTab === 'transactions' ? (isSender ? 'Total Outflow' : 'Total Revenue') : 'Total Sub Fees'}
          </p>
          <p className="text-4xl font-black mb-4">
            {totalValue.toLocaleString()} <span className="text-sm font-bold text-slate-500">ETB</span>
          </p>
          <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">
            {activeTab === 'transactions' && isPicker ? 'Direct P2P Income' : 'Direct Payment'}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Count</p>
          <p className="text-4xl font-black text-slate-900 mb-2">{displayedData.length}</p>
          <p className="text-xs font-medium text-slate-500">Matching Records Found</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg. Value</p>
          <p className="text-4xl font-black text-[#009E49] mb-2">{averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-bold text-slate-300">ETB</span></p>
          <p className="text-xs font-medium text-slate-500">Per Transaction</p>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="text-xs font-black uppercase tracking-widest text-slate-900">Filters</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            {activeTab === 'transactions' ? (
              <>
                <option value={ItemStatus.POSTED}>Posted</option>
                <option value={ItemStatus.REQUESTED}>Requested</option>
                <option value={ItemStatus.IN_TRANSIT}>In Transit</option>
                <option value={ItemStatus.DELIVERED}>Delivered</option>
              </>
            ) : (
              <>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="bg-transparent text-xs font-bold text-slate-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="bg-transparent text-xs font-bold text-slate-900 outline-none"
          />
        </div>

        {(filterStatus !== 'ALL' || dateRange.start || dateRange.end) && (
          <button
            onClick={() => { setFilterStatus('ALL'); setDateRange({ start: '', end: '' }); }}
            className="ml-auto text-xs font-bold text-red-500 hover:text-red-600 px-3"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Ref ID</th>
                <th className="px-8 py-6">Date & Time</th>
                <th className="px-8 py-6">Details</th>
                <th className="px-8 py-6 text-right">Amount (ETB)</th>
                <th className="px-8 py-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No Records Found</p>
                    <p className="text-slate-400 text-xs mt-2">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                displayedData.map((item) => {
                  // Check for plan_name (backend) or planName (frontend type)
                  const isSub = 'plan_name' in item || 'planName' in item;

                  // Handle Date (backend sends timestamp for subs, createdAt/created_at for shipments)
                  const rawDate = isSub
                    ? ((item as any).timestamp)
                    : ((item as any).createdAt || (item as any).created_at);
                  const date = new Date(rawDate);

                  const amount = (isSub ? (item as any).amount : ((item as any).fee)) ?? 0;
                  const refId = item.id.slice(0, 8).toUpperCase();
                  const status = item.status;
                  const planName = (item as any).plan_name || (item as any).planName;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${!isSub ? 'group' : ''}`}
                      onClick={() => !isSub && navigate(`/shipment-detail/${item.id}`)}
                    >
                      <td className="px-8 py-6 font-mono text-xs text-slate-500 font-bold group-hover:text-slate-900">
                        #{refId}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{date.toLocaleDateString()}</span>
                          <span className="text-xs text-slate-400 font-semibold">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {isSub ? (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{planName} Subscription</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                  {(item as any).payment_method || (item as any).paymentMethod || 'Manual'}
                                </span>
                                {((item as any).transaction_reference || (item as any).transactionReference) && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {(item as any).transaction_reference || (item as any).transactionReference}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{(item as ShipmentItem).category || 'Shipment'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{(item as ShipmentItem).pickupCountry} → {(item as ShipmentItem).destCountry}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`text-sm font-black ${isSub ? 'text-indigo-600' : 'text-[#009E49]'}`}>
                          {isSub ? '-' : (isSender ? '-' : '+')} {amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${status === ItemStatus.DELIVERED || status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {status.replace('_', ' ')}
                        </span>
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

export default BillingPage;
