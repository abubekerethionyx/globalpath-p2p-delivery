
import React, { useState, useEffect } from 'react';
import { User, ShipmentItem, ItemStatus, VerificationStatus } from '../../types';
import { ShipmentService } from '../../services/ShipmentService';
import ShipmentCard from '../../components/ShipmentCard';
import { useNavigate } from 'react-router-dom';

interface PickerDashboardProps {
    user: User;
}

type PickerTab = 'REQUESTS' | 'LOCKED' | 'TRANSIT' | 'COMPLETED';

const PickerDashboard: React.FC<PickerDashboardProps> = ({ user }) => {
    const navigate = useNavigate();
    const [items, setItems] = useState<ShipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<ItemStatus>(ItemStatus.IN_TRANSIT);
    const [activeTab, setActiveTab] = useState<PickerTab>('REQUESTS');

    const fetchItems = async () => {
        try {
            const allItems = await ShipmentService.getAllShipments();
            const myItems = allItems.filter(item => item.partnerId === user.id);
            setItems(myItems);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch shipments", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        const interval = setInterval(fetchItems, 10000);
        return () => clearInterval(interval);
    }, [user.id]);

    const groupedItems = {
        [ItemStatus.REQUESTED]: items.filter(i => i.status === ItemStatus.REQUESTED),
        [ItemStatus.PICKED]: items.filter(i => i.status === ItemStatus.PICKED),
        [ItemStatus.IN_TRANSIT]: items.filter(i => i.status === ItemStatus.IN_TRANSIT),
        [ItemStatus.ARRIVED]: items.filter(i => i.status === ItemStatus.ARRIVED),
        [ItemStatus.DELIVERED]: items.filter(i => i.status === ItemStatus.DELIVERED),
    };

    const requestedCount = groupedItems[ItemStatus.REQUESTED].length;
    const lockedCount = groupedItems[ItemStatus.PICKED].length;
    const transitCount = groupedItems[ItemStatus.IN_TRANSIT].length + groupedItems[ItemStatus.ARRIVED].length;
    const historyCount = groupedItems[ItemStatus.DELIVERED].length;

    const totalEarned = items.reduce((acc, curr) => acc + curr.fee, 0);

    const onUpdateStatus = async (id: string, status: ItemStatus) => {
        try {
            await ShipmentService.updateStatus(id, status);
            fetchItems();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedIds);
        if (selected) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.size === 0) return;
        for (const id of Array.from(selectedIds)) {
            await ShipmentService.updateStatus(id as string, bulkStatus);
        }
        setSelectedIds(new Set());
        fetchItems();
        alert(`Successfully updated ${selectedIds.size} items to ${bulkStatus.replace('_', ' ')}`);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
        </div>
    );

    const StatusGrid = ({ statusItems, emptyMessage, isRequest = false }: { statusItems: ShipmentItem[], emptyMessage: string, isRequest?: boolean }) => {
        if (statusItems.length === 0) return (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{emptyMessage}</p>
            </div>
        );
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                {statusItems.map(item => (
                    <div key={item.id} className="relative group">
                        <ShipmentCard
                            item={item}
                            role={user.role}
                            onUpdateStatus={onUpdateStatus}
                            onSelect={handleSelect}
                            isSelected={selectedIds.has(item.id)}
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => navigate(`/shipment-detail/${item.id}`)}
                                className="bg-white/90 p-2 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </div>
                        {isRequest && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Awaiting Approval</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Step 1/2</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-4">
            {/* Security Alerts */}
            {user.verificationStatus !== VerificationStatus.VERIFIED && (
                <div className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between shadow-xl ${user.verificationStatus === VerificationStatus.PENDING
                    ? 'bg-amber-50 border-amber-100 text-amber-900'
                    : 'bg-red-50 border-red-100 text-red-900'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${user.verificationStatus === VerificationStatus.PENDING ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                            {user.verificationStatus === VerificationStatus.PENDING ? (
                                <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">
                                {user.verificationStatus === VerificationStatus.PENDING
                                    ? 'Clearance Pending'
                                    : 'Mandatory ID Check Required'}
                            </h3>
                            <p className="text-sm font-medium opacity-70 mt-1 max-w-lg">
                                {user.verificationStatus === VerificationStatus.PENDING
                                    ? 'Our security team is currently reviewing your artifacts. Your dashboard is in read-only mode for new work.'
                                    : 'Identity verification is mandatory for all pickers to initiate global logistics flows.'}
                            </p>
                        </div>
                    </div>
                    {user.verificationStatus === VerificationStatus.UNVERIFIED && (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/registration')}
                                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Start Identity Registry
                            </button>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center">Protocol 1.0 Not Initiated</p>
                        </div>
                    )}
                    {user.verificationStatus === VerificationStatus.PENDING && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                Intercepted: Under Review
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <p className="text-[#009E49] text-[10px] font-black uppercase tracking-[0.3em]">Logistics Command</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Picker Dashboard</h1>
                    <p className="text-slate-500 font-medium text-lg">Partner Node: <span className="text-slate-900 font-bold">{user.firstName} {user.lastName}</span></p>
                </div>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transform hover:-translate-y-1 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Discover Deliveries
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-amber-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting Approval</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{requestedCount}</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">In Pipeline</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{lockedCount + transitCount}</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Revenue Generated</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-4xl font-black">{totalEarned.toLocaleString()}</p>
                        <p className="text-xs font-bold opacity-50">ETB</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Partner Reliability</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{user.rating?.toFixed(1) || '0.0'}</p>
                </div>
            </div>

            {/* Granular Navigation Tabs */}
            <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-[2rem] w-fit">
                <button
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'REQUESTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${requestedCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    Claim Requests ({requestedCount})
                </button>
                <button
                    onClick={() => setActiveTab('LOCKED')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LOCKED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Locked Items ({lockedCount})
                </button>
                <button
                    onClick={() => setActiveTab('TRANSIT')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TRANSIT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Active Delivery ({transitCount})
                </button>
                <button
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Completed Logs ({historyCount})
                </button>
            </div>

            {/* Filtered Content */}
            <div className="min-h-[400px]">
                {activeTab === 'REQUESTS' && (
                    <StatusGrid
                        statusItems={groupedItems[ItemStatus.REQUESTED]}
                        emptyMessage="No active requests pending sender approval"
                        isRequest={true}
                    />
                )}
                {activeTab === 'LOCKED' && (
                    <StatusGrid statusItems={groupedItems[ItemStatus.PICKED]} emptyMessage="No shipments locked for your next trip" />
                )}
                {activeTab === 'TRANSIT' && (
                    <StatusGrid statusItems={[
                        ...groupedItems[ItemStatus.IN_TRANSIT],
                        ...groupedItems[ItemStatus.ARRIVED]
                    ]} emptyMessage="No shipments currently in the global flow" />
                )}
                {activeTab === 'COMPLETED' && (
                    <StatusGrid statusItems={groupedItems[ItemStatus.DELIVERED]} emptyMessage="Fulfillment log is currently empty" />
                )}
            </div>

            {/* Bulk Update Navigation */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl z-[100] flex items-center gap-8 border border-white/10 backdrop-blur-xl bg-opacity-90 animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#009E49] w-10 h-10 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg shadow-[#009E49]/20">
                            {selectedIds.size}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Selected</p>
                            <p className="text-sm font-bold">Units for Batch Update</p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-white/10"></div>

                    <div className="flex items-center gap-4">
                        <select
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value as ItemStatus)}
                            className="bg-slate-800 border-none rounded-xl px-4 py-2.5 font-bold text-xs focus:ring-2 focus:ring-[#009E49]"
                        >
                            <option value={ItemStatus.PICKED}>Locked (Ready)</option>
                            <option value={ItemStatus.IN_TRANSIT}>In Transit</option>
                            <option value={ItemStatus.ARRIVED}>Arrived at Dest.</option>
                            <option value={ItemStatus.DELIVERED}>Finalized (Delivered)</option>
                        </select>
                        <button
                            onClick={handleBulkUpdate}
                            className="bg-[#009E49] px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#007A38] transition-all shadow-lg shadow-[#009E49]/20"
                        >
                            Deploy Meta Update
                        </button>
                    </div>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="bg-white/5 p-3 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default PickerDashboard;
