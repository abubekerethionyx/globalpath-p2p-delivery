import React, { useState, useEffect, useMemo } from 'react';
import { User, Travel, UserRole, ShipmentItem, ItemStatus } from '../types';
import { TravelService } from '../services/TravelService';
import { ShipmentService } from '../services/ShipmentService';
import TravelCard from '../components/TravelCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

interface FeedPageProps {
    user: User | null;
}

const FeedPage: React.FC<FeedPageProps> = ({ user }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [travels, setTravels] = useState<Travel[]>([]);
    const [myItems, setMyItems] = useState<ShipmentItem[]>([]);
    const [myPinnedTravelIds, setMyPinnedTravelIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
    const [countries, setCountries] = useState<string[]>([]);

    // Search/Filters
    const [search, setSearch] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');

    // Post Travel Form
    const [postForm, setPostForm] = useState({
        origin_country: '',
        destination_country: '',
        travel_date: '',
        weight_capacity: 0,
        description: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [travelsRes, countriesRes] = await Promise.all([
                TravelService.getAllTravels({ per_page: 500 }),
                ShipmentService.getSupportedCountries()
            ]);
            setTravels(travelsRes.travels);
            setCountries(countriesRes);

            if (user) {
                const { shipments } = await ShipmentService.getAllShipments({ per_page: 500 });
                setMyItems(shipments.filter(i => i.senderId === user.id && i.status === ItemStatus.POSTED));

                // Fetch user's pinned travels
                const pinnedSet = new Set<string>();
                for (const travel of travelsRes.travels) {
                    try {
                        const pins = await TravelService.getTravelPins(travel.id);
                        const userPinned = pins.some(pin => pin.shipment.senderId === user.id);
                        if (userPinned) {
                            pinnedSet.add(travel.id);
                        }
                    } catch (e) {
                        console.error(`Failed to check pins for travel ${travel.id}`, e);
                    }
                }
                setMyPinnedTravelIds(pinnedSet);
            }
        } catch (e) {
            console.error("Failed to fetch feed data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const filteredTravels = useMemo(() => {
        return travels.filter(t =>
            (!origin || t.origin_country === origin) &&
            (!destination || t.destination_country === destination) &&
            (statusFilter === 'ALL' || t.status === statusFilter) &&
            (t.origin_country.toLowerCase().includes(search.toLowerCase()) ||
                t.destination_country.toLowerCase().includes(search.toLowerCase()) ||
                t.description?.toLowerCase().includes(search.toLowerCase()))
        );
    }, [travels, search, origin, destination, statusFilter]);

    const handlePostTravel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            await TravelService.createTravel(postForm);
            setShowPostModal(false);
            fetchData();
            showToast("Travel announced successfully!", 'SUCCESS');
        } catch (e) {
            showToast("Failed to post travel.", 'ERROR');
        }
    };

    const handlePinItem = async (shipmentId: string) => {
        if (!selectedTravel) return;
        try {
            await TravelService.pinItem(selectedTravel.id, shipmentId);
            setShowPinModal(false);
            setMyPinnedTravelIds(prev => new Set(prev).add(selectedTravel.id));
            fetchData();
            showToast("Item pinned successfully!", 'SUCCESS');
        } catch (e: any) {
            showToast("Failed to pin item. " + e.message, 'ERROR');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
        </div>
    );

    return (
        <div className="space-y-12 py-6 animate-in">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 bg-slate-900 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#009E49] opacity-10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400 opacity-5 blur-[80px] rounded-full -ml-32 -mb-32"></div>

                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <span className="flex h-2 w-2 rounded-full bg-[#009E49] animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Global Logistics Protocol Active</p>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight leading-none">The Travel Feed</h1>
                    <p className="text-slate-400 text-lg font-medium max-w-xl">
                        Browse upcoming international travels or announce your own trip to help others ship their items globally.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4">
                    {user && user.role === 'PICKER' ? (
                        <button
                            onClick={() => setShowPostModal(true)}
                            className="px-10 py-5 bg-[#009E49] text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-green-900/40 hover:scale-105 transition-transform flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            Announce Travel
                        </button>
                    ) : !user ? (
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform"
                        >
                            Sign in to Post
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                    <svg className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Filter by country, notes, or user..."
                        className="w-full pl-14 pr-6 py-5 bg-transparent rounded-[2.5rem] text-sm font-bold focus:ring-0 focus:outline-none placeholder:text-slate-300"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="h-10 w-px bg-slate-100 hidden lg:block self-center"></div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        className="px-8 py-4 bg-slate-50 border-none rounded-[1.8rem] text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#009E49] cursor-pointer"
                        value={origin}
                        onChange={e => setOrigin(e.target.value)}
                    >
                        <option value="">Origin: All</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="px-8 py-4 bg-slate-50 border-none rounded-[1.8rem] text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#009E49] cursor-pointer"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                    >
                        <option value="">Destination: All</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${statusFilter === status
                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                            : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'
                            }`}
                    >
                        {status} Travels
                    </button>
                ))}
            </div>

            {/* Travel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTravels.map(travel => (
                    <TravelCard
                        key={travel.id}
                        travel={travel}
                        currentUser={user}
                        isPinned={myPinnedTravelIds.has(travel.id)}
                        onPinClick={(t) => {
                            const isClosed = t.status === 'COMPLETED' || t.status === 'CANCELLED' || (new Date(t.travel_date) < new Date());

                            if (!user) {
                                navigate('/login');
                            } else if (user.role !== 'SENDER') {
                                showToast('Only senders can pin items to travels.', 'WARNING');
                            } else if (isClosed) {
                                showToast('This travel is closed and cannot accept new pins.', 'WARNING');
                            } else if (myPinnedTravelIds.has(t.id)) {
                                showToast('You have already pinned an item to this travel.', 'WARNING');
                            } else {
                                setSelectedTravel(t);
                                setShowPinModal(true);
                            }
                        }}
                    />
                ))}
                {filteredTravels.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-lg font-bold text-slate-400">No travels found matching your search.</p>
                        <button onClick={() => { setSearch(''); setOrigin(''); setDestination(''); }} className="text-[#009E49] font-black uppercase text-xs tracking-widest mt-4">Reset Parameters</button>
                    </div>
                )}
            </div>

            {/* Post Travel Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Announce Your Trip</h3>
                                    <p className="text-slate-500 font-medium">Sharing your journey helps others connect.</p>
                                </div>
                                <button onClick={() => setShowPostModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handlePostTravel} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Origin</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#009E49]"
                                            value={postForm.origin_country}
                                            onChange={e => setPostForm({ ...postForm, origin_country: e.target.value })}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Destination</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#009E49]"
                                            value={postForm.destination_country}
                                            onChange={e => setPostForm({ ...postForm, destination_country: e.target.value })}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Travel Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#009E49]"
                                            value={postForm.travel_date}
                                            onChange={e => setPostForm({ ...postForm, travel_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Capacity (kg)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 23"
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#009E49]"
                                            value={postForm.weight_capacity}
                                            onChange={e => setPostForm({ ...postForm, weight_capacity: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Trip Details</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Mention any specific items you can carry or details about your baggage allowance..."
                                        className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#009E49]"
                                        value={postForm.description}
                                        onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200"
                                >
                                    Broadcast Announcement
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Pin Item Modal */}
            {showPinModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pin Your Item</h3>
                                    <p className="text-slate-500 font-medium">Select a shipment to pin to this travel.</p>
                                </div>
                                <button onClick={() => setShowPinModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {myItems.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 font-bold mb-6">You have no active items on the marketplace to pin.</p>
                                    <button onClick={() => navigate('/post-item')} className="px-8 py-4 bg-[#009E49] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100">Post New Item</button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {myItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handlePinItem(item.id)}
                                            className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-[#009E49] hover:bg-green-50 transition-all cursor-pointer group flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#009E49] font-black shadow-sm group-hover:scale-110 transition-transform">
                                                    {item.category?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{item.description || item.category}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.pickupCountry} → {item.destCountry}</p>
                                                </div>
                                            </div>
                                            <svg className="w-6 h-6 text-slate-200 group-hover:text-[#009E49] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedPage;
