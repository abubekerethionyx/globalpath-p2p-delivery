import React, { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Travel, TravelPin, UserRole, ItemStatus } from '../types';
import { TravelService } from '../services/TravelService';
import { ShipmentService } from '../services/ShipmentService';
import { useToast } from '../components/ToastContext';

interface TravelDetailPageProps {
    user: User | null;
}

const TravelDetailPage: React.FC<TravelDetailPageProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [travel, setTravel] = useState<Travel | null>(null);
    const [pins, setPins] = useState<TravelPin[]>([]);
    const [loading, setLoading] = useState(true);
    const [myRequestsStatus, setMyRequestsStatus] = useState<Record<string, string>>({});
    const { showToast } = useToast();

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

            if (user && user.role === UserRole.PICKER) {
                const myReqs = await ShipmentService.getMyRequests();
                const statusMap: Record<string, string> = {};
                myReqs.forEach((r: any) => {
                    statusMap[r.shipment.id] = r.status;
                });
                setMyRequestsStatus(statusMap);
            }
        } catch (e) {
            console.error("Failed to fetch travel details", e);
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
            // Optionally refresh travel details if status changes
            fetchTravelDetails();
        } catch (e) {
            showToast("Failed to pick shipment. It might be already requested.", 'ERROR');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
        </div>
    );

    if (!travel) return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Transmission Lost</h2>
                <p className="text-slate-500 mb-8">This travel announcement could not be retrieved from the network.</p>
                <button onClick={() => navigate('/feed')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Return to Feed</button>
            </div>
        </div>
    );

    const isPosterSubscribed = travel.user.is_subscription_active;

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
            {/* Travel Hero Card */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-12">
                <div className="p-10 lg:p-16">
                    <div className="flex flex-col lg:flex-row justify-between gap-12">
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center gap-6">
                                <img
                                    src={travel.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${travel.user.first_name}`}
                                    className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-50 shadow-xl"
                                />
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{travel.user.first_name} {travel.user.last_name}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="px-3 py-1 bg-green-50 text-[#009E49] text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                                            {travel.user.verification_status} Partner
                                        </span>
                                        {isPosterSubscribed ? (
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 flex items-center gap-1.5">
                                                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                Active Subscription
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                                                Free Tier
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 relative shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                    <div className="text-left">
                                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Origin Hub</p>
                                        <p className="text-3xl font-black text-slate-900">{travel.origin_country}</p>
                                    </div>

                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg text-[#009E49]">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Destination Hub</p>
                                        <p className="text-3xl font-black text-slate-900">{travel.destination_country}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Date</p>
                                    <p className="text-lg font-black text-slate-900">
                                        {new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Load Balance</p>
                                    <p className="text-lg font-black text-slate-900">{travel.weight_capacity ? `${travel.weight_capacity} kg` : 'Flexible Load'}</p>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl col-span-2 md:col-span-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className={`text-lg font-black uppercase tracking-widest ${travel.status === 'ACTIVE' ? 'text-[#009E49]' : 'text-slate-400'}`}>
                                        {travel.status}
                                    </p>
                                </div>
                            </div>

                            {travel.description && (
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium italic underline-offset-8 decoration-slate-200 decoration-wavy">
                                        "{travel.description}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pinned Items Section */}
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pinned Load Inventory</h2>
                        <p className="text-slate-500 font-medium">Currently registered shipments for this trip protocol.</p>
                    </div>
                    <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        {pins.length} Items Total
                    </div>
                </div>

                {pins.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 border border-slate-100 text-center shadow-sm">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No shipments pinned yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {pins.map(pin => (
                            <div key={pin.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow group relative overflow-hidden">
                                {pin.status === 'APPROVED' && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 opacity-5 -mr-12 -mt-12 rounded-full"></div>}

                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-[#009E49] font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                            {pin.shipment.category?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900">{pin.shipment.category}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sent by {pin.shipment.sender?.firstName}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${pin.status === 'APPROVED' ? 'bg-green-100 text-[#009E49]' :
                                        pin.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                        {pin.status}
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-slate-600 mb-8 line-clamp-2 min-h-[40px]">
                                    {pin.shipment.description || "No specific details provided for this shipment artifact."}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Weight</p>
                                        <p className="text-sm font-black text-slate-900">{pin.shipment.weight} kg</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Fee</p>
                                        <p className="text-sm font-black text-[#009E49]">{pin.shipment.fee.toLocaleString()} ETB</p>
                                    </div>
                                </div>

                                {isPosterSubscribed ? (
                                    <>
                                        {user?.role === UserRole.ADMIN || (user?.role === UserRole.SENDER && pin.shipment.sender?.id === user?.id) ? (
                                            <button
                                                onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                View Cargo Manifest
                                            </button>
                                        ) : user?.role === UserRole.PICKER && user?.id === travel.user.id ? (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    View Cargo Manifest
                                                </button>
                                                {pin.status === 'APPROVED' && pin.shipment.status === ItemStatus.POSTED && (
                                                    <button
                                                        onClick={() => handlePickShipment(pin.shipment.id)}
                                                        disabled={!!myRequestsStatus[pin.shipment.id]}
                                                        className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${myRequestsStatus[pin.shipment.id]
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                            : 'bg-[#009E49] text-white hover:bg-[#007A38] shadow-green-100'
                                                            }`}
                                                    >
                                                        {myRequestsStatus[pin.shipment.id] ? (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Request {myRequestsStatus[pin.shipment.id]}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                                Pick Shipment
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full py-8 bg-amber-50 border-2 border-amber-200 rounded-[2rem] text-center">
                                                <svg className="w-12 h-12 text-amber-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">Access Restricted</p>
                                                <p className="text-[10px] font-medium text-amber-600">Only authorized users can interact with this shipment</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-5 bg-amber-50 rounded-[2rem] border border-amber-100 group/lock cursor-not-allowed">
                                        <div className="flex items-center gap-4 text-amber-700">
                                            <svg className="w-5 h-5 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Access Protocol Locked</p>
                                                <p className="text-[9px] font-medium opacity-80">This traveler is seen as a logged-in user. Details are authorized users only.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelDetailPage;
