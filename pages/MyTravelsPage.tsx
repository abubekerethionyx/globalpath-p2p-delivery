import React, { useState, useEffect } from 'react';
import { User, Travel, TravelPin } from '../types';
import { TravelService } from '../services/TravelService';
import { ShipmentService } from '../services/ShipmentService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

interface MyTravelsPageProps {
    user: User;
}

const MyTravelsPage: React.FC<MyTravelsPageProps> = ({ user }) => {
    const navigate = useNavigate();
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTravelPins, setSelectedTravelPins] = useState<{ [key: string]: TravelPin[] }>({});
    const [loadingPins, setLoadingPins] = useState<{ [key: string]: boolean }>({});
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
    const { showToast } = useToast();

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'DANGER' | 'INFO';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'INFO',
        onConfirm: () => { }
    });

    const fetchMyTravels = async () => {
        try {
            const data = await TravelService.getMyTravels();
            setTravels(data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch my travels", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTravels();
    }, []);

    const loadPinsForTravel = async (travelId: string) => {
        if (loadingPins[travelId]) return;
        setLoadingPins(prev => ({ ...prev, [travelId]: true }));
        try {
            const pins = await TravelService.getTravelPins(travelId);
            setSelectedTravelPins(prev => ({ ...prev, [travelId]: pins }));
        } catch (e) {
            console.error("Failed to load pins", e);
        } finally {
            setLoadingPins(prev => ({ ...prev, [travelId]: false }));
        }
    };

    const handleUpdatePinStatus = async (pinId: string, travelId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', shipmentId?: string) => {
        try {
            await TravelService.updatePinStatus(pinId, status);

            // If approved, also send a picking request to the sender automatically
            if (status === 'APPROVED' && shipmentId) {
                try {
                    await ShipmentService.pickShipment(shipmentId);
                    console.log("Picking request sent automatically for shipment:", shipmentId);
                } catch (pickError) {
                    console.error("Failed to automatically send pick request", pickError);
                    // We don't alert here as the pin approval itself succeeded
                }
            }

            showToast(`Pin ${status.toLowerCase()} successfully!`, 'SUCCESS');
            // Reload pins for this travel
            loadPinsForTravel(travelId);
        } catch (e) {
            showToast("Failed to update pin status", 'ERROR');
        }
    };

    const handleDeleteTravel = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Announcement',
            message: 'Are you sure you want to remove this travel announcement? This action cannot be undone.',
            type: 'DANGER',
            onConfirm: async () => {
                try {
                    await TravelService.deleteTravel(id);
                    setTravels(prev => prev.filter(t => t.id !== id));
                    showToast("Travel deleted successfully", 'SUCCESS');
                } catch (e) {
                    showToast("Failed to delete travel", 'ERROR');
                } finally {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleUpdateTravelStatus = async (id: string, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
        try {
            await TravelService.updateTravelStatus(id, status);
            setTravels(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            showToast(`Travel status updated to ${status}`, 'SUCCESS');
        } catch (e) {
            showToast("Failed to update travel status", 'ERROR');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
        </div>
    );

    return (
        <div className="space-y-12 py-6 animate-in">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Travel Station</h2>
                    </div>
                    <p className="text-slate-500 font-medium text-lg">Manage your announcements and coordinate with senders.</p>
                </div>
                <button
                    onClick={() => navigate('/feed')}
                    className="px-8 py-4 bg-[#009E49] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#007A38] transition shadow-lg shadow-green-100"
                >
                    Announce New Trip
                </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map(status => {
                    const count = status === 'ALL' ? travels.length : travels.filter(t => t.status === status).length;
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === status
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'
                                }`}
                        >
                            <span>{status}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] ${statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {travels.filter(t => statusFilter === 'ALL' || t.status === statusFilter).length === 0 ? (
                    <div className="bg-white rounded-[3.5rem] p-20 border border-slate-100 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </div>
                        <p className="text-xl font-bold text-slate-400">
                            {travels.length === 0 ? "You haven't announced any travels yet." : `No ${statusFilter.toLowerCase()} travels found.`}
                        </p>
                        <button onClick={() => navigate('/feed')} className="text-[#009E49] font-black uppercase text-sm tracking-widest mt-6 hover:underline">Go to Feed</button>
                    </div>
                ) : (
                    travels.filter(t => statusFilter === 'ALL' || t.status === statusFilter).map(travel => (
                        <div key={travel.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group">
                            <div className="p-10">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 border-b border-slate-50 pb-10 mb-10">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-4 py-4 px-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner min-w-[300px]">
                                            <div className="text-left flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                                                <p className="text-lg font-black text-slate-900">{travel.origin_country}</p>
                                            </div>
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009E49]">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </div>
                                            <div className="text-right flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                                                <p className="text-lg font-black text-slate-900">{travel.destination_country}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Travel Date</p>
                                            <p className="text-lg font-black text-slate-900">
                                                {new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Travel Status Badge */}
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${travel.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' :
                                            travel.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            • {travel.status}
                                        </div>

                                        <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                                            <p className="text-sm font-black text-slate-900">{travel.weight_capacity || 'N/A'} kg</p>
                                        </div>

                                        {/* Status Dropdown */}
                                        <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                                            <select
                                                value={travel.status}
                                                onChange={(e) => handleUpdateTravelStatus(travel.id, e.target.value as 'ACTIVE' | 'COMPLETED' | 'CANCELLED')}
                                                className={`text-sm font-black border-none bg-transparent focus:ring-0 cursor-pointer uppercase tracking-widest ${travel.status === 'ACTIVE' ? 'text-[#009E49]' :
                                                    travel.status === 'COMPLETED' ? 'text-blue-600' :
                                                        'text-red-500'
                                                    }`}
                                            >
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="COMPLETED">COMPLETED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteTravel(travel.id)}
                                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Pinned Items ({travel.pins_count})</h3>
                                        <button
                                            onClick={() => loadPinsForTravel(travel.id)}
                                            className="text-xs font-black text-[#009E49] uppercase tracking-widest hover:underline flex items-center gap-2"
                                        >
                                            {loadingPins[travel.id] && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-green-500"></div>}
                                            Refresh Network
                                        </button>
                                    </div>

                                    {travel.pins_count === 0 ? (
                                        <div className="py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Waiting for senders to pin items...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {(selectedTravelPins[travel.id] || []).map(pin => (
                                                <div key={pin.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between group/pin">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#009E49] font-black shadow-sm group-hover/pin:scale-110 transition-all">
                                                                    {pin.shipment.category?.[0] || 'S'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-tight">{pin.shipment.description || pin.shipment.category}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">by {pin.shipment.sender?.firstName}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${pin.status === 'APPROVED' ? 'bg-green-100 text-[#009E49]' :
                                                                pin.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                                                    'bg-amber-100 text-amber-600'
                                                                }`}>
                                                                {pin.status}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                                                                <p className="text-xs font-bold text-slate-900">{pin.shipment.weight} kg</p>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Offer Fee</p>
                                                                <p className="text-xs font-black text-[#009E49]">{pin.shipment.fee.toLocaleString()} ETB</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                            className="w-full mb-3 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            View Cargo Profile
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {pin.status === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdatePinStatus(pin.id, travel.id, 'REJECTED', pin.shipment.id)}
                                                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-sm"
                                                                >
                                                                    Decline
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdatePinStatus(pin.id, travel.id, 'APPROVED', pin.shipment.id)}
                                                                    className="flex-1 py-3 bg-[#009E49] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#007A38] transition shadow-lg shadow-green-100"
                                                                >
                                                                    Approve
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUpdatePinStatus(pin.id, travel.id, 'PENDING', pin.shipment.id)}
                                                                className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                                                            >
                                                                Reset Status
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Fetch pins trigger if not loaded yet */}
                                            {travel.pins_count > 0 && !selectedTravelPins[travel.id] && (
                                                <div className="col-span-full py-10 text-center">
                                                    <button
                                                        onClick={() => loadPinsForTravel(travel.id)}
                                                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition shadow-xl shadow-slate-200"
                                                    >
                                                        Inspect Pinned Inventory
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default MyTravelsPage;
