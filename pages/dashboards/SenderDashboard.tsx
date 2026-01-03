
import React, { useState, useEffect } from 'react';
import { User, ShipmentItem, ItemStatus } from '../../types';
import { ShipmentService } from '../../services/ShipmentService';
import ShipmentCard from '../../components/ShipmentCard';
import { useNavigate } from 'react-router-dom';

interface SenderDashboardProps {
    user: User;
}

type SenderTab = 'ACTION' | 'PIPELINE' | 'MARKETPLACE' | 'HISTORY';

const SenderDashboard: React.FC<SenderDashboardProps> = ({ user }) => {
    const navigate = useNavigate();
    const [items, setItems] = useState<ShipmentItem[]>([]);
    const [activeTab, setActiveTab] = useState<SenderTab>('ACTION');
    const [requestsMap, setRequestsMap] = useState<{ [key: string]: any[] }>({});
    const [loading, setLoading] = useState(true);
    const [selectedPicker, setSelectedPicker] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelect = (id: string, selected: boolean) => {
        const newSelected = new Set(selectedIds);
        if (selected) newSelected.add(id);
        else newSelected.delete(id);
        setSelectedIds(newSelected);
    };

    const handleBulkConfirm = async () => {
        if (!window.confirm(`Confirm delivery for ${selectedIds.size} shipments?`)) return;
        try {
            await Promise.all(Array.from(selectedIds).map(id =>
                ShipmentService.updateStatus(id as string, ItemStatus.DELIVERED)
            ));
            fetchItems();
            setSelectedIds(new Set());
            alert("Deliveries Confirmed!");
        } catch (e) {
            console.error(e);
            alert("Error confirming deliveries");
        }
    };

    const fetchItems = async () => {
        try {
            const { shipments } = await ShipmentService.getAllShipments({ per_page: 500 });
            const myItems = shipments.filter(item => item.senderId === user.id);
            setItems(myItems);

            // Fetch requests for POSTED items
            const myPostedItems = myItems.filter(i => i.status === ItemStatus.POSTED);
            const newRequestsMap: { [key: string]: any[] } = {};

            await Promise.all(myPostedItems.map(async (item) => {
                try {
                    const reqs = await ShipmentService.getRequests(item.id);
                    if (reqs && reqs.length > 0) {
                        const pending = reqs.filter((r: any) => r.status === 'PENDING');
                        if (pending.length > 0) newRequestsMap[item.id] = pending;
                    }
                } catch (e) { }
            }));
            setRequestsMap(newRequestsMap);

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
        [ItemStatus.POSTED]: items.filter(i => i.status === ItemStatus.POSTED),
        [ItemStatus.REQUESTED]: items.filter(i => i.status === ItemStatus.REQUESTED),
        [ItemStatus.APPROVED]: items.filter(i => i.status === ItemStatus.APPROVED),
        [ItemStatus.PICKED]: items.filter(i => i.status === ItemStatus.PICKED),
        [ItemStatus.IN_TRANSIT]: items.filter(i => i.status === ItemStatus.IN_TRANSIT),
        [ItemStatus.ARRIVED]: items.filter(i => i.status === ItemStatus.ARRIVED),
        [ItemStatus.WAITING_CONFIRMATION]: items.filter(i => i.status === ItemStatus.WAITING_CONFIRMATION),
        [ItemStatus.DELIVERED]: items.filter(i => i.status === ItemStatus.DELIVERED),
    };

    const pendingRequestCount = Object.keys(requestsMap).length;
    const waitingConfirmationCount = groupedItems[ItemStatus.WAITING_CONFIRMATION].length;
    const approvedCount = (groupedItems[ItemStatus.APPROVED] || []).length;
    const actionCount = pendingRequestCount + (groupedItems[ItemStatus.REQUESTED] || []).length + approvedCount + waitingConfirmationCount;
    const pipelineCount = groupedItems[ItemStatus.PICKED].length + groupedItems[ItemStatus.IN_TRANSIT].length + groupedItems[ItemStatus.ARRIVED].length;
    const marketplaceCount = groupedItems[ItemStatus.POSTED].length;
    const historyCount = groupedItems[ItemStatus.DELIVERED].length;

    const totalSpent = items.reduce((acc, curr) => acc + curr.fee, 0);

    const handleApproveRequest = async (requestId: string) => {
        try {
            await ShipmentService.approveRequest(requestId);
            alert("Partner assigned! All other pending requests for this shipment have been automatically declined.");
            fetchItems();
        } catch (e) {
            alert("Error approving request");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!window.confirm("Reject this partner?")) return;
        try {
            await ShipmentService.rejectRequest(requestId);
            fetchItems();
        } catch (e) {
            alert("Error rejecting request");
        }
    };

    const onUpdateStatus = async (id: string, status: ItemStatus) => {
        try {
            await ShipmentService.updateStatus(id, status);
            fetchItems();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    const StatusGrid = ({ statusItems, emptyMessage }: { statusItems: ShipmentItem[], emptyMessage: string }) => {
        if (statusItems.length === 0) return (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
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
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => navigate(`/shipment-detail/${item.id}`)}
                                className="bg-white/90 p-2 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </div>
                        {item.status === ItemStatus.REQUESTED && (
                            // This block is likely legacy or if status is manually set to REQUESTED. 
                            // If using new flow, approved items become REQUESTED.
                            <div className="mt-4 space-y-2">
                                {/* Actions for already approved items (e.g. mark picked) - reusing logic */}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <p className="text-[#009E49] text-[10px] font-black uppercase tracking-[0.3em]">Operational Panel</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sender Dashboard</h1>
                    <p className="text-slate-500 font-medium text-lg">Managing logistics for <span className="text-slate-900 font-bold">{user.firstName} {user.lastName}</span></p>
                </div>
                <button
                    onClick={() => navigate('/post-item')}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transform hover:-translate-y-1 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Initiate New Shipment
                </button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* ... stats ... */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting Decision</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{actionCount}</p>
                </div>
                {/* ... other stats ... */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">In Pipeline</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{pipelineCount}</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Market Exposure</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{marketplaceCount}</p>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Financial footprint</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-4xl font-black">{totalSpent.toLocaleString()}</p>
                        <p className="text-xs font-bold opacity-50 uppercase">ETB</p>
                    </div>
                </div>
            </div>

            {/* Granular Tab Navigation */}
            <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-[2rem] w-fit">
                <button
                    onClick={() => setActiveTab('ACTION')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'ACTION' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${actionCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    Needs Action {actionCount > 0 && `(${actionCount})`}
                </button>
                <button
                    onClick={() => setActiveTab('PIPELINE')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PIPELINE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    In Pipeline ({pipelineCount})
                </button>
                <button
                    onClick={() => setActiveTab('MARKETPLACE')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MARKETPLACE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Active on Marketplace ({marketplaceCount})
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Historical Logs ({historyCount})
                </button>
            </div>

            {/* Content Logic */}
            <div className="min-h-[400px]">
                {activeTab === 'ACTION' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                        {/* Waiting Confirmation Section */}
                        {groupedItems[ItemStatus.WAITING_CONFIRMATION].length > 0 && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Confirm Deliveries</h3>
                                            <p className="text-slate-500 font-medium text-sm">Partners have reported delivery. Please confirm receipt.</p>
                                        </div>
                                    </div>
                                    {selectedIds.size > 0 && (
                                        <button
                                            onClick={handleBulkConfirm}
                                            className="px-6 py-3 bg-amber-500 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all animate-in zoom-in"
                                        >
                                            Confirm ({selectedIds.size})
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedItems[ItemStatus.WAITING_CONFIRMATION].map(item => (
                                        <ShipmentCard
                                            key={item.id}
                                            item={item}
                                            role={user.role}
                                            onUpdateStatus={onUpdateStatus}
                                            onSelect={handleSelect}
                                            isSelected={selectedIds.has(item.id)}
                                            isRequested={false} // Should be false as it's active
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Pending Requests Section */}
                        {Object.entries(requestsMap).map(([itemId, reqs]) => {
                            const item = items.find(i => i.id === itemId);
                            if (!item) return null;
                            return (
                                <div key={itemId} className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Incoming Requests</h3>
                                            <p className="text-slate-500 font-medium text-sm">Pickers requesting: <span className="font-bold text-indigo-600">{item.description}</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {(Array.isArray(reqs) ? reqs : []).map((req: any) => (
                                            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-2xl gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                        {req.picker.firstName[0]}{req.picker.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-lg">{req.picker.firstName} {req.picker.lastName}</p>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{req.picker.verificationStatus} Partner</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <button onClick={() => navigate(`/picker-profile/${req.picker.id}`)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100">Review Profile</button>
                                                    <button onClick={() => handleRejectRequest(req.id)} className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100">Decline</button>
                                                    <button onClick={() => handleApproveRequest(req.id)} className="px-6 py-3 bg-[#009E49] text-white font-bold rounded-xl text-xs hover:bg-[#007A38] shadow-lg shadow-green-900/20">Approve & Assign</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Approved Status Items */}
                        {(groupedItems[ItemStatus.APPROVED] || []).length > 0 && (
                            <StatusGrid statusItems={groupedItems[ItemStatus.APPROVED]} emptyMessage="" />
                        )}

                        {/* Legacy REQUESTED Status Items */}
                        {(groupedItems[ItemStatus.REQUESTED] || []).length > 0 && (
                            <StatusGrid statusItems={groupedItems[ItemStatus.REQUESTED]} emptyMessage="" />
                        )}

                        {Object.keys(requestsMap).length === 0 && (groupedItems[ItemStatus.APPROVED] || []).length === 0 && (groupedItems[ItemStatus.REQUESTED] || []).length === 0 && (
                            <StatusGrid statusItems={[]} emptyMessage="No active requests or actions needed." />
                        )}
                    </div>
                )}
                {activeTab === 'PIPELINE' && (
                    <StatusGrid statusItems={[
                        ...groupedItems[ItemStatus.PICKED],
                        ...groupedItems[ItemStatus.IN_TRANSIT],
                        ...groupedItems[ItemStatus.ARRIVED]
                    ]} emptyMessage="No shipments currently in the logistics pipeline" />
                )}
                {activeTab === 'MARKETPLACE' && (
                    <StatusGrid statusItems={groupedItems[ItemStatus.POSTED]} emptyMessage="No shipments currently visible on marketplace" />
                )}
                {activeTab === 'HISTORY' && (
                    <StatusGrid statusItems={groupedItems[ItemStatus.DELIVERED]} emptyMessage="Fulfillment history is empty" />
                )}
            </div>

            {/* Picker Profile Modal */}
            {selectedPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setSelectedPicker(null)}
                            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                        >
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="p-10">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl bg-slate-200 flex items-center justify-center text-4xl font-black text-slate-400">
                                        {selectedPicker.firstName?.[0]}{selectedPicker.lastName?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#009E49] text-white p-2 rounded-xl shadow-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">{selectedPicker.firstName} {selectedPicker.lastName}</h3>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Verified Logistics Partner</p>

                                <div className="flex items-center gap-2 mt-4 bg-amber-50 px-4 py-2 rounded-full">
                                    <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    <span className="text-lg font-black text-slate-900">{Math.random() > 0.5 ? '4.9' : '5.0'}</span>
                                    <span className="text-slate-400 text-xs font-bold font-medium uppercase tracking-widest ml-1">Reliability</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Success Rate</p>
                                    <p className="text-lg font-black text-slate-900">100%</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Units Delivered</p>
                                    <p className="text-lg font-black text-slate-900">{Math.floor(Math.random() * 50) + 1}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-4">
                            <button
                                onClick={() => setSelectedPicker(null)}
                                className="flex-1 py-4 bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    alert("Messaging feature available upon approval.");
                                    setSelectedPicker(null);
                                }}
                                className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1"
                            >
                                Contact Partner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SenderDashboard;
