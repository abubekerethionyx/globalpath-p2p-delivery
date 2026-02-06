import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Travel, TravelPin, UserRole, ItemStatus, ShipmentItem } from '../types';
import { TravelService } from '../services/TravelService';
import { ShipmentService } from '../services/ShipmentService';
import { useToast } from '../components/ToastContext';

interface TravelDetailPageProps {
    user: User | null;
}

const TravelDetailPage: React.FC<TravelDetailPageProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [travel, setTravel] = useState<Travel | null>(null);
    const [pins, setPins] = useState<TravelPin[]>([]);
    const [loading, setLoading] = useState(true);
    const [myRequestsStatus, setMyRequestsStatus] = useState<Record<string, string>>({});
    const [myItems, setMyItems] = useState<ShipmentItem[]>([]);
    const [showPinModal, setShowPinModal] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [isAlreadyPinned, setIsAlreadyPinned] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTravelDetails();
        }
    }, [id, user?.id]);

    const fetchTravelDetails = async () => {
        try {
            setLoading(true);
            const [travelData, pinsData] = await Promise.all([
                TravelService.getTravel(id!),
                TravelService.getTravelPins(id!)
            ]);
            setTravel(travelData);
            setPins(pinsData);

            // Check if user has already pinned an item
            if (user) {
                const userPinned = pinsData.some(pin => pin.shipment.senderId === user.id);
                setIsAlreadyPinned(userPinned);

                if (user.role === UserRole.PICKER) {
                    const myReqs = await ShipmentService.getMyRequests();
                    const statusMap: Record<string, string> = {};
                    myReqs.forEach((r: any) => {
                        statusMap[r.shipment.id] = r.status;
                    });
                    setMyRequestsStatus(statusMap);
                }

                if (user.role === UserRole.SENDER && !userPinned) {
                    const { shipments } = await ShipmentService.getAllShipments({ per_page: 500 });
                    setMyItems(shipments.filter(i => i.senderId === user.id && i.status === ItemStatus.POSTED));
                }
            }
        } catch (e) {
            console.error("Failed to fetch travel details", e);
            showToast("Failed to sync with logistics core.", 'ERROR');
        } finally {
            setLoading(false);
        }
    };

    const handlePickShipment = async (shipmentId: string) => {
        if (!user || user.role !== UserRole.PICKER) return;

        try {
            await ShipmentService.pickShipment(shipmentId);
            showToast("Pick request sent! The sender has been notified.", 'SUCCESS');
            setMyRequestsStatus(prev => ({ ...prev, [shipmentId]: 'PENDING' }));
            fetchTravelDetails();
        } catch (e) {
            showToast("Failed to pick shipment. It might be already requested.", 'ERROR');
        }
    };

    const handlePinItem = async (shipmentId: string) => {
        if (!travel || !user) return;
        setIsPinning(true);
        try {
            await TravelService.pinItem(travel.id, shipmentId);
            showToast("Item pinned successfully to this protocol!", 'SUCCESS');
            setShowPinModal(false);
            fetchTravelDetails();
        } catch (e: any) {
            showToast("Failed to pin item: " + (e.response?.data?.message || e.message), 'ERROR');
        } finally {
            setIsPinning(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#009E49]"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Payload...</p>
            </div>
        </div>
    );

    if (!travel) return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50">
            <div className="max-w-md p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Transmission Lost</h2>
                <p className="text-slate-500 mb-8 font-medium">This travel node could not be retrieved from the decentralized network.</p>
                <button onClick={() => navigate('/feed')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95">Return to Feed</button>
            </div>
        </div>
    );

    const isExpired = new Date(travel.travel_date) < new Date();
    const isClosed = travel.status !== 'ACTIVE' || isExpired;
    const isPosterSubscribed = travel.user.is_subscription_active;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            {/* High-Concept Header Section */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-full h-full">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-[#009E49] opacity-20 blur-[150px] rounded-full"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[60%] bg-blue-600 opacity-10 blur-[120px] rounded-full"></div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        <div className="flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
                                <span className={`h-2 w-2 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-[#009E49] animate-pulse'} shadow-[0_0_12px_rgba(0,158,73,0.5)]`}></span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{isClosed ? 'Protocol Closed' : 'Transmission Active'}</p>
                            </div>
                            {isPosterSubscribed && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-xl border border-indigo-400/30 rounded-full">
                                    <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Priority Node</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                                {travel.origin_country} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">TO {travel.destination_country}</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-medium max-w-lg">
                                International travel scheduled for <span className="text-white font-bold">{new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-4">
                            {!user ? (
                                <button onClick={() => navigate('/login')} className="px-10 py-5 bg-[#009E49] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-900/40 hover:scale-105 transition-all">Sign In to Pin</button>
                            ) : user.role === UserRole.SENDER && !isAlreadyPinned && !isClosed && (
                                <button
                                    onClick={() => setShowPinModal(true)}
                                    className="px-10 py-5 bg-[#009E49] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-900/40 hover:scale-105 transition-all flex items-center gap-3"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                    Pin My Shipment
                                </button>
                            )}
                            {isAlreadyPinned && (
                                <div className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#009E49]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Item Pinned
                                </div>
                            )}
                            <div className="flex -space-x-3">
                                {[...Array(Math.min(pins.length, 4))].map((_, i) => (
                                    <div key={i} className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black overflow-hidden ring-2 ring-white/5">
                                        <img src={pins[i].shipment.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ))}
                                {pins.length > 4 && (
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-black ring-2 ring-white/5">
                                        +{pins.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <img
                                        src={travel.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${travel.user.first_name}`}
                                        className="w-20 h-20 rounded-3xl object-cover border-2 border-white/20 shadow-2xl transition-transform group-hover:scale-110"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-[#009E49] p-1.5 rounded-xl border-2 border-slate-900 shadow-xl">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{travel.user.first_name} {travel.user.last_name}</h3>
                                    <p className="text-xs font-black text-[#009E49] uppercase tracking-widest">{travel.user.verification_status}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payload Cap</p>
                                    <p className="text-2xl font-black">{travel.weight_capacity ? `${travel.weight_capacity} KG` : 'Flexible'}</p>
                                </div>
                                <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pins Recorded</p>
                                    <p className="text-2xl font-black">{pins.length}</p>
                                </div>
                            </div>

                            {travel.description && (
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-dashed border-white/20">
                                    <p className="text-sm font-medium text-slate-400 italic leading-relaxed">
                                        "{travel.description}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 md:px-0 space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cargo Manifest</h2>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total volume registered to this travel node.</p>
                    </div>
                    {user?.role === UserRole.SENDER && !isAlreadyPinned && !isClosed && (
                        <button onClick={() => setShowPinModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Add Shipment</button>
                    )}
                </div>

                {pins.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm animate-in fade-in duration-1000">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Zero Load Registered</h3>
                        <p className="text-slate-400 max-w-sm mx-auto font-medium">Be the first to secure space on this route. This node is currently accepting pin requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pins.map(pin => (
                            <div key={pin.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                                {/* Status Indicator Strip */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${pin.status === 'APPROVED' ? 'bg-[#009E49]' : pin.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-400'}`}></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#009E49] text-xl font-black shadow-inner group-hover:bg-green-50 group-hover:scale-110 transition-all duration-500">
                                            {pin.shipment.category?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#009E49] transition-colors">{pin.shipment.category}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">By {pin.shipment.sender?.firstName}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${pin.status === 'APPROVED' ? 'bg-green-50 text-[#009E49] border border-green-100' :
                                        pin.status === 'REJECTED' ? 'bg-red-50 text-red-500 border border-red-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                                        }`}>
                                        {pin.status}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 mb-6 group-hover:bg-white group-hover:border-slate-100 border border-transparent transition-all">
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-3">
                                        {pin.shipment.description || "Payload registered without additional protocols."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mass</p>
                                        <p className="text-lg font-black text-slate-900">{pin.shipment.weight} KG</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Contract</p>
                                        <p className="text-lg font-black text-[#009E49]">λ{pin.shipment.fee.toLocaleString()}</p>
                                    </div>
                                </div>

                                {isPosterSubscribed ? (
                                    <div className="space-y-3">
                                        {(user?.role === UserRole.ADMIN || (user?.role === UserRole.SENDER && pin.shipment.sender?.id === user?.id) || (user?.role === UserRole.PICKER && user?.id === travel.user.id)) ? (
                                            <button
                                                onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                Inspect Manifest
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        ) : (
                                            <div className="w-full py-4 bg-slate-50 rounded-2xl border border-slate-100 text-center opacity-50">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Locked to Peer</p>
                                            </div>
                                        )}

                                        {user?.role === UserRole.PICKER && user?.id === travel.user.id && pin.status === 'APPROVED' && pin.shipment.status === ItemStatus.POSTED && (
                                            <button
                                                onClick={() => handlePickShipment(pin.shipment.id)}
                                                disabled={!!myRequestsStatus[pin.shipment.id]}
                                                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${myRequestsStatus[pin.shipment.id]
                                                    ? 'bg-amber-50 text-amber-600 border border-amber-100 cursor-not-allowed'
                                                    : 'bg-[#009E49] text-white hover:bg-[#007A38] shadow-xl shadow-green-100'
                                                    }`}
                                            >
                                                {myRequestsStatus[pin.shipment.id] ? (
                                                    <>
                                                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                                                        {myRequestsStatus[pin.shipment.id]} Protocol
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        Confirm Pickup
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-center relative overflow-hidden group/lock">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#009E49] opacity-20 blur-[60px]"></div>
                                        <div className="relative z-10 flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 border border-white/10 group-hover/lock:rotate-12 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Premium Access Required</p>
                                            <button onClick={() => navigate('/packaging')} className="text-[#009E49] text-[9px] font-black uppercase mt-1 hover:underline">Unlock Transmissions</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pin Item Modal */}
            {showPinModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-500">
                        <div className="p-10 md:p-14 relative">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#009E49]/10 blur-[80px] -mr-24 -mt-24"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 blur-[70px] -ml-20 -mb-20"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Initialize Pin</h3>
                                        <p className="text-slate-500 font-medium">Select a verified shipment to pin to this travel node.</p>
                                    </div>
                                    <button onClick={() => setShowPinModal(false)} className="p-4 bg-slate-50 rounded-[1.5rem] hover:bg-slate-100 hover:rotate-90 transition-all duration-300">
                                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {myItems.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                        </div>
                                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest mb-8">No Idle Shipments Found</p>
                                        <button onClick={() => navigate('/post-item')} className="px-10 py-5 bg-[#009E49] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-green-100 hover:scale-105 transition-all">Post New Request</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                                        {myItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => !isPinning && handlePinItem(item.id)}
                                                className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-[#009E49] hover:bg-green-50/50 transition-all cursor-pointer group flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#009E49] text-xl font-black shadow-sm group-hover:scale-110 group-hover:bg-[#009E49] group-hover:text-white transition-all duration-500">
                                                        {item.category?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-slate-900 group-hover:text-[#009E49] transition-colors">{item.description || item.category}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                                                            {item.pickupCountry}
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                            {item.destCountry}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-[#009E49] group-hover:text-white transition-all">
                                                    {isPinning ? (
                                                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TravelDetailPage;
