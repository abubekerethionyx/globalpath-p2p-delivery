
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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SenderTab>('ACTION');
    const [selectedPicker, setSelectedPicker] = useState<User | null>(null);

    const fetchItems = async () => {
        try {
            const allItems = await ShipmentService.getAllShipments();
            const myItems = allItems.filter(item => item.senderId === user.id);
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
        [ItemStatus.POSTED]: items.filter(i => i.status === ItemStatus.POSTED),
        [ItemStatus.REQUESTED]: items.filter(i => i.status === ItemStatus.REQUESTED),
        [ItemStatus.PICKED]: items.filter(i => i.status === ItemStatus.PICKED),
        [ItemStatus.IN_TRANSIT]: items.filter(i => i.status === ItemStatus.IN_TRANSIT),
        [ItemStatus.ARRIVED]: items.filter(i => i.status === ItemStatus.ARRIVED),
        [ItemStatus.DELIVERED]: items.filter(i => i.status === ItemStatus.DELIVERED),
    };

    const actionCount = groupedItems[ItemStatus.REQUESTED].length;
    const pipelineCount = groupedItems[ItemStatus.PICKED].length + groupedItems[ItemStatus.IN_TRANSIT].length + groupedItems[ItemStatus.ARRIVED].length;
    const marketplaceCount = groupedItems[ItemStatus.POSTED].length;
    const historyCount = groupedItems[ItemStatus.DELIVERED].length;

    const totalSpent = items.reduce((acc, curr) => acc + curr.fee, 0);

    const handleApprove = async (itemId: string) => {
        try {
            await ShipmentService.updateStatus(itemId, ItemStatus.PICKED);
            fetchItems();
        } catch (e) {
            alert("Error approving partner");
        }
    };

    const handleReject = async (itemId: string) => {
        if (!window.confirm("Reject this request? The item will be listed back on the marketplace.")) return;
        try {
            await ShipmentService.updateStatus(itemId, ItemStatus.POSTED);
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
                            <div className="mt-4 space-y-2">
                                {item.partner && (
                                    <button
                                        onClick={() => setSelectedPicker(item.partner || null)}
                                        className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Verify Picker Identity
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(item.id)}
                                        className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-xs hover:bg-red-100 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(item.id)}
                                        className="flex-1 py-3 bg-[#009E49] text-white font-bold rounded-2xl text-xs hover:bg-[#007A38] transition-colors"
                                    >
                                        Approve
                                    </button>
                                </div>
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
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting Decision</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{actionCount}</p>
                </div>

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
                    <StatusGrid statusItems={groupedItems[ItemStatus.REQUESTED]} emptyMessage="No pending requests to approve" />
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
                                    <img
                                        src={selectedPicker.avatar}
                                        className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl"
                                        alt={selectedPicker.firstName}
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-[#009E49] text-white p-2 rounded-xl shadow-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">{selectedPicker.firstName} {selectedPicker.lastName}</h3>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Verified Logistics Partner</p>

                                <div className="flex items-center gap-2 mt-4 bg-amber-50 px-4 py-2 rounded-full">
                                    <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3-.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    <span className="text-lg font-black text-slate-900">{selectedPicker.rating?.toFixed(1) || 'N/A'}</span>
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
                                    <p className="text-lg font-black text-slate-900">{selectedPicker.completedDeliveries || 0}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Identity Verified</p>
                                            <p className="text-xs font-bold text-slate-900">{selectedPicker.phoneNumber || 'Restricted Access'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[#009E49] text-[10px] font-black uppercase">Active Node</span>
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
                                    alert("Messaging feature coming soon in direct profile view.");
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
