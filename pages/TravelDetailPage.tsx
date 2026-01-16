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
        <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700 pb-24 px-3 md:px-4 pt-16 md:pt-20">
            {/* Travel Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
                <div className="p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={travel.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${travel.user.first_name}`}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-50 shadow-sm"
                            />
                            <div>
                                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">{travel.user.first_name} {travel.user.last_name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-1.5 py-0.5 bg-green-50 text-[#009E49] text-[8px] font-black uppercase tracking-widest rounded border border-green-100">
                                        {travel.user.verification_status}
                                    </span>
                                    {isPosterSubscribed && (
                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded border border-indigo-100 flex items-center gap-1">
                                            <span className="flex h-1 w-1 rounded-full bg-indigo-500 animate-pulse"></span>
                                            Pro
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative shadow-inner">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Origin</p>
                                    <p className="text-sm font-black text-slate-900 truncate">{travel.origin_country}</p>
                                </div>

                                <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009E49] border border-slate-100">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>

                                <div className="text-right flex-1 min-w-0">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destination</p>
                                    <p className="text-sm font-black text-slate-900 truncate">{travel.destination_country}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-white border border-slate-100 rounded-xl text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                <p className="text-xs font-black text-slate-900">
                                    {new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="p-2 bg-white border border-slate-100 rounded-xl text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Load</p>
                                <p className="text-xs font-black text-slate-900">{travel.weight_capacity ? `${travel.weight_capacity}kg` : 'Flex'}</p>
                            </div>
                            <div className="p-2 bg-white border border-slate-100 rounded-xl text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                <p className={`text-xs font-black uppercase tracking-widest ${travel.status === 'ACTIVE' ? 'text-[#009E49]' : 'text-slate-400'}`}>
                                    {travel.status}
                                </p>
                            </div>
                        </div>

                        {travel.description && (
                            <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500 text-[10px] font-medium italic leading-relaxed">
                                    "{travel.description}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pinned Items Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Inventory ({pins.length})</h2>
                </div>

                {pins.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center shadow-sm">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No shipments pinned yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pins.map(pin => (
                            <div key={pin.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#009E49] font-black text-xs shadow-inner">
                                            {pin.shipment.category?.[0] || 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 truncate">{pin.shipment.category}</h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">by {pin.shipment.sender?.firstName}</p>
                                        </div>
                                    </div>
                                    <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${pin.status === 'APPROVED' ? 'bg-green-100 text-[#009E49]' :
                                        pin.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                        {pin.status}
                                    </div>
                                </div>

                                <p className="text-[10px] font-medium text-slate-600 mb-3 line-clamp-2 min-h-[20px]">
                                    {pin.shipment.description || "No specific details."}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Weight</p>
                                        <p className="text-[10px] font-black text-slate-900">{pin.shipment.weight} kg</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fee</p>
                                        <p className="text-[10px] font-black text-[#009E49]">{pin.shipment.fee.toLocaleString()}</p>
                                    </div>
                                </div>

                                {isPosterSubscribed ? (
                                    <>
                                        {user?.role === UserRole.ADMIN || (user?.role === UserRole.SENDER && pin.shipment.sender?.id === user?.id) ? (
                                            <button
                                                onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                className="w-full py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                            >
                                                View Manifest
                                            </button>
                                        ) : user?.role === UserRole.PICKER && user?.id === travel.user.id ? (
                                            <div className="space-y-1.5">
                                                <button
                                                    onClick={() => navigate(`/shipment-detail/${pin.shipment.id}`)}
                                                    className="w-full py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                                >
                                                    View Manifest
                                                </button>
                                                {pin.status === 'APPROVED' && pin.shipment.status === ItemStatus.POSTED && (
                                                    <button
                                                        onClick={() => handlePickShipment(pin.shipment.id)}
                                                        disabled={!!myRequestsStatus[pin.shipment.id]}
                                                        className={`w-full py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 ${myRequestsStatus[pin.shipment.id]
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                            : 'bg-[#009E49] text-white hover:bg-[#007A38] shadow-green-100'
                                                            }`}
                                                    >
                                                        {myRequestsStatus[pin.shipment.id] ? (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                {myRequestsStatus[pin.shipment.id]}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                                Pick
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-amber-700">Restricted</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 group/lock cursor-not-allowed">
                                        <div className="flex items-center gap-2 text-amber-700 justify-center">
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            <p className="text-[8px] font-black uppercase tracking-widest">Locked</p>
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
