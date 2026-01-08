import React, { useState, useEffect } from 'react';
import { Travel, TravelPin } from '../../types';
import { TravelService } from '../../services/TravelService';
import { useToast } from '../../components/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminTravelsTab: React.FC = () => {
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
    const [pins, setPins] = useState<TravelPin[]>([]);
    const [loadingPins, setLoadingPins] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
    const { showToast } = useToast();

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'DANGER' | 'INFO';
        confirmLabel?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'INFO',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchTravels();
    }, []);

    const fetchTravels = async () => {
        try {
            setLoading(true);
            const response = await TravelService.getAllTravels({ per_page: 1000 });
            setTravels(response.travels);
        } catch (e) {
            console.error("Failed to fetch travels", e);
        } finally {
            setLoading(false);
        }
    };

    const loadPins = async (travel: Travel) => {
        setSelectedTravel(travel);
        setLoadingPins(true);
        try {
            const pinsData = await TravelService.getTravelPins(travel.id);
            setPins(pinsData);
        } catch (e) {
            console.error("Failed to load pins", e);
        } finally {
            setLoadingPins(false);
        }
    };

    const handleUpdateStatus = async (travelId: string, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
        try {
            await TravelService.updateTravelStatus(travelId, status);
            setTravels(prev => prev.map(t => t.id === travelId ? { ...t, status } : t));
            if (selectedTravel?.id === travelId) {
                setSelectedTravel(prev => prev ? { ...prev, status } : null);
            }
        } catch (e) {
            showToast("Failed to update status", 'ERROR');
        }
    };

    const handleDeleteTravel = async (travelId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Travel Announcement',
            message: "Are you sure you want to permanently delete this travel and all associated pins? This action cannot be undone.",
            type: 'DANGER',
            confirmLabel: 'Delete Permanently',
            onConfirm: async () => {
                try {
                    await TravelService.deleteTravel(travelId);
                    setTravels(prev => prev.filter(t => t.id !== travelId));
                    if (selectedTravel?.id === travelId) {
                        setSelectedTravel(null);
                        setPins([]);
                    }
                    showToast("Travel deleted successfully.", 'SUCCESS');
                } catch (e) {
                    showToast("Failed to delete travel", 'ERROR');
                } finally {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const filteredTravels = travels.filter(t => statusFilter === 'ALL' || t.status === statusFilter);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Travel Management</h2>
                    <p className="text-slate-500 font-medium">Monitor and manage all travel announcements</p>
                </div>
                <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    {filteredTravels.length} Travels
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
                {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status
                            ? 'bg-slate-900 text-white shadow-xl'
                            : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Travels Table */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Traveler</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pins</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTravels.map(travel => (
                                <tr key={travel.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={travel.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${travel.user.first_name}`}
                                                className="w-10 h-10 rounded-xl object-cover"
                                                alt={travel.user.first_name}
                                            />
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{travel.user.first_name} {travel.user.last_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{travel.user.verification_status}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900">{travel.origin_country}</span>
                                            <svg className="w-4 h-4 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            <span className="text-sm font-bold text-slate-900">{travel.destination_country}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">
                                            {new Date(travel.travel_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{travel.weight_capacity || 'N/A'} kg</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => loadPins(travel)}
                                            className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
                                        >
                                            {travel.pins_count} Pins
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={travel.status}
                                            onChange={(e) => handleUpdateStatus(travel.id, e.target.value as 'ACTIVE' | 'COMPLETED' | 'CANCELLED')}
                                            className={`text-xs font-black border-none bg-transparent focus:ring-0 cursor-pointer uppercase tracking-widest ${travel.status === 'ACTIVE' ? 'text-[#009E49]' :
                                                travel.status === 'COMPLETED' ? 'text-blue-600' :
                                                    'text-red-500'
                                                }`}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteTravel(travel.id)}
                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pins Modal */}
            {selectedTravel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pinned Items</h3>
                                    <p className="text-slate-500 font-medium">{selectedTravel.origin_country} → {selectedTravel.destination_country}</p>
                                </div>
                                <button onClick={() => { setSelectedTravel(null); setPins([]); }} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {loadingPins ? (
                                <div className="py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#009E49] mx-auto"></div>
                                </div>
                            ) : pins.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No items pinned</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {pins.map(pin => (
                                        <div key={pin.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#009E49] font-black shadow-sm">
                                                        {pin.shipment.category?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{pin.shipment.description || pin.shipment.category}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">by {pin.shipment.sender?.firstName}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${pin.status === 'APPROVED' ? 'bg-green-100 text-[#009E49]' :
                                                    pin.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                                        'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {pin.status}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white p-3 rounded-xl">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                                                    <p className="text-xs font-bold text-slate-900">{pin.shipment.weight} kg</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee</p>
                                                    <p className="text-xs font-black text-[#009E49]">{pin.shipment.fee.toLocaleString()} ETB</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmLabel={modalConfig.confirmLabel}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminTravelsTab;
