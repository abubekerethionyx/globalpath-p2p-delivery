import React from 'react';
import { Travel, TravelPin, User, UserRole } from '../types';
import { TravelService } from '../services/TravelService';
import { useNavigate } from 'react-router-dom';

interface TravelCardProps {
    travel: Travel;
    onPinClick: (travel: Travel) => void;
    currentUser: User | null;
    isPinned?: boolean;
}

const TravelCard: React.FC<TravelCardProps> = ({ travel, onPinClick, currentUser, isPinned = false }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = React.useState(false);
    const [pins, setPins] = React.useState<TravelPin[]>([]);
    const [loadingPins, setLoadingPins] = React.useState(false);

    const isExpired = new Date(travel.travel_date) < new Date();

    const toggleExpand = async () => {
        if (!expanded && pins.length === 0 && travel.pins_count > 0) {
            setLoadingPins(true);
            try {
                const data = await TravelService.getTravelPins(travel.id);
                setPins(data);
            } catch (e) {
                console.error("Failed to fetch pins", e);
            } finally {
                setLoadingPins(false);
            }
        }
        setExpanded(!expanded);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={travel.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${travel.user.first_name}`}
                            alt={travel.user.first_name}
                            className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">
                                {travel.user.first_name} {travel.user.last_name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Traveler • {travel.user.verification_status}
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isExpired ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-[#009E49]'}`}>
                        {isExpired ? 'Completed' : 'Upcoming'}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                            <p className="text-sm font-bold text-slate-900">{travel.origin_country}</p>
                        </div>
                        <div className="flex items-center justify-center p-2 bg-white rounded-full shadow-sm border border-slate-100 absolute left-1/2 -translate-x-1/2">
                            <svg className="w-4 h-4 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                            <p className="text-sm font-bold text-slate-900">{travel.destination_country}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white border border-slate-100 rounded-xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Date</p>
                            <p className="text-xs font-bold text-slate-900">
                                {new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                            <p className="text-xs font-bold text-slate-900">{travel.weight_capacity ? `${travel.weight_capacity} kg` : 'Flexible'}</p>
                        </div>
                    </div>

                    {travel.description && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                            "{travel.description}"
                        </p>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={toggleExpand}>
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(travel.pins_count, 3))].map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                            ))}
                            {travel.pins_count > 3 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                                    +{travel.pins_count - 3}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            {travel.pins_count} Pinned
                            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/travel/${travel.id}`)}
                            className="px-4 py-2.5 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
                        >
                            Inspect Trip
                        </button>
                        {currentUser?.role !== UserRole.PICKER && (
                            <button
                                onClick={() => onPinClick(travel)}
                                disabled={isPinned}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg ${isPinned
                                    ? 'bg-green-100 text-[#009E49] cursor-not-allowed shadow-green-50'
                                    : 'bg-slate-900 text-white hover:bg-black shadow-slate-100'
                                    }`}
                            >
                                {isPinned ? (
                                    <>
                                        <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Already Pinned
                                    </>
                                ) : 'Pin Item'}
                            </button>
                        )}
                    </div>
                </div>

                {expanded && (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 border-t border-slate-50 pt-6">
                        {loadingPins ? (
                            <div className="py-4 text-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#009E49] mx-auto"></div>
                            </div>
                        ) : pins.length === 0 ? (
                            <p className="text-[10px] text-center text-slate-400 py-4 font-bold uppercase tracking-widest">No items pinned yet</p>
                        ) : (
                            pins.map(pin => (
                                <div key={pin.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between group/pin">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#009E49] text-[10px] font-black shadow-sm">
                                            {pin.shipment.category?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 leading-tight">{pin.shipment.description || pin.shipment.category}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                by {pin.shipment.sender?.firstName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-white rounded-md text-[7px] font-black uppercase tracking-widest text-[#009E49] border border-green-100 shadow-sm">
                                        {pin.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelCard;
