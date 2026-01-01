
import React, { useState, useEffect } from 'react';
import { User, ShipmentItem, ItemStatus, VerificationStatus } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipmentService } from '../services/ShipmentService';
import { MessageService } from '../services/MessageService';
import { BASE_URL } from '../config';

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  // If already absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Otherwise prepend BASE_URL
  return `${BASE_URL}${url}`;
};

interface ShipmentDetailPageProps {
  currentUser: User;
}

const ShipmentDetailPage: React.FC<ShipmentDetailPageProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ShipmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const fetchedItem = await ShipmentService.getShipment(id);
        setItem(fetchedItem);
      } catch (e) {
        console.error("Failed to fetch shipment", e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleMessage = async (otherUserId: string) => {
    if (!item) return;
    try {
      const thread = await MessageService.createThread(otherUserId, item.id);
      navigate('/messages', { state: { threadId: thread.id } });
    } catch (e) {
      console.error("Failed to initiate thread", e);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!item) return;
    if (!window.confirm("Confirm that you have received the shipment and are satisfied?")) return;
    try {
      await ShipmentService.updateStatus(item.id, ItemStatus.DELIVERED);
      const updated = await ShipmentService.getShipment(item.id);
      setItem(updated);
    } catch (e) {
      console.error(e);
      alert("Failed to confirm receipt");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
    </div>
  );
  if (!item) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <p className="text-slate-400 font-bold">Artifact not found in protocol history.</p>
      <button onClick={() => navigate('/dashboard')} className="text-[#009E49] font-black uppercase text-xs tracking-widest hover:underline">Return to Hub</button>
    </div>
  );

  const steps = [
    { status: ItemStatus.POSTED, label: 'Manifest Created', desc: 'Item successfully registered on protocol' },
    { status: ItemStatus.REQUESTED, label: 'Claims Initiated', desc: 'Partner has requested this delivery node' },
    { status: ItemStatus.PICKED, label: 'Partner Validated', desc: 'Handover sequence approved by sender' },
    { status: ItemStatus.IN_TRANSIT, label: 'Active Transit', desc: 'Shipment currently in global motion' },
    { status: ItemStatus.ARRIVED, label: 'Dest. Arrived', desc: 'Package reached the target local hub' },
    { status: ItemStatus.WAITING_CONFIRMATION, label: 'Pending Signature', desc: 'Partner awaiting final sign-off' },
    { status: ItemStatus.DELIVERED, label: 'Final Handover', desc: 'Protocol complete - Item delivered' },
  ];

  const currentIdx = Object.values(ItemStatus).indexOf(item.status);
  const isDelivered = item.status === ItemStatus.DELIVERED;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700 pb-24 px-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] transition group">
          <svg className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Dashboard
        </button>
        <div className="flex gap-2 items-center">
          {/* Edit Button - Only for sender and POSTED status */}
          {item.senderId === currentUser.id && (item.status === ItemStatus.POSTED || item.status === ItemStatus.REQUESTED) && (
            <button
              onClick={() => navigate(`/post-shipment/${item.id}`)}
              className="bg-[#009E49] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-green-100 hover:bg-[#007A38] transition"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}
          <p className="text-slate-300 font-mono text-[9px] bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">NODE: {item.id.split('-')[0]}</p>
          {isDelivered && (
            <span className="bg-[#009E49] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-green-100">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Success
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Core Info & Timeline */}
        <div className="lg:col-span-8 space-y-6">

          {/* Main Card */}
          <div className={`bg-white rounded-[2.5rem] border overflow-hidden transition-all shadow-sm ${isDelivered ? 'border-[#009E49]/30 shadow-green-50' : 'border-slate-100'}`}>
            <div className="p-8 md:p-10 relative">
              {/* Visual Route Strip */}
              <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin Node</p>
                  <p className="text-sm font-black text-slate-900">{item.pickupCountry}</p>
                </div>
                <div className="flex-none flex items-center px-4">
                  <div className="w-2 h-2 rounded-full bg-[#009E49]"></div>
                  <div className={`h-px w-20 md:w-40 border-t-2 border-dashed ${isDelivered ? 'border-[#009E49]' : 'border-slate-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-[#009E49]' : 'border-2 border-slate-200'}`}></div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Node</p>
                  <p className="text-sm font-black text-slate-900">{item.destCountry}</p>
                </div>
              </div>

              {/* Picked Time Display */}
              {(item.picked_at || item.pickedAt) && (
                <div className="mb-8 text-center bg-green-50/50 p-2 rounded-xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                    Shipment Picked: {new Date(item.picked_at || item.pickedAt || '').toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="flex-1 space-y-6">
                  <div>
                    <span className="inline-block bg-[#009E49]/10 text-[#009E49] text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-3">
                      {item.category || 'Standard Shipment'}
                    </span>
                    <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                      {item.description || "General Logistics Cargo"}
                    </h1>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Weight</p>
                      <p className="text-lg font-black text-slate-900">{item.weight} <span className="text-xs font-bold opacity-30">KG</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reward Value</p>
                      <p className="text-lg font-black text-[#009E49]">{item.fee.toLocaleString()} <span className="text-xs font-bold opacity-30">ETB</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Seal</p>
                      <p className="text-sm font-black text-indigo-600">P2P ENCRYPTED</p>
                    </div>
                    {(item.available_pickup_time || item.availablePickupTime) && (
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup Available</p>
                        <p className="text-xs font-black text-slate-900 leading-tight">
                          {new Date(item.available_pickup_time || item.availablePickupTime || '').toLocaleDateString()}
                          <br />
                          <span className="text-[10px] text-slate-500">{new Date(item.available_pickup_time || item.availablePickupTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Gallery */}
                  {(item.image_urls || item.imageUrls) && (item.image_urls || item.imageUrls)!.length > 0 && (
                    <div className="pt-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Item Visuals</p>
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {(item.image_urls || item.imageUrls)!.map((url, idx) => (
                          <img
                            key={idx}
                            src={getImageUrl(url)}
                            alt={`Item preview ${idx + 1}`}
                            className="h-32 w-32 object-cover rounded-2xl border border-slate-200 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Vertical */}
                <div className="flex-none md:w-64 space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Protocol Status</p>
                  <div className="space-y-6 relative">
                    <div className="absolute left-3 top-2 bottom-8 w-px bg-slate-100" />
                    {steps.map((step, idx) => {
                      const isActive = item.status === step.status;
                      const isPast = idx <= currentIdx;
                      return (
                        <div key={step.status} className="relative pl-8 group">
                          <div className={`absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 bg-white ${isActive ? 'border-[#009E49] shadow-[0_0_8px_rgba(0,158,73,0.3)]' : isPast ? 'border-[#009E49]' : 'border-slate-200'
                            }`}>
                            {isPast && (
                              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[#009E49] animate-pulse' : 'bg-[#009E49]'}`}></div>
                            )}
                          </div>
                          <div>
                            <h4 className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-[#009E49] scale-110 origin-left' : isPast ? 'text-slate-900' : 'text-slate-300'} transition-all`}>{step.label}</h4>
                            <p className={`text-[8px] font-bold text-slate-400 leading-none mt-1 transition-opacity whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{step.desc}</p>

                            {/* Action Button for Sender in Waiting State */}
                            {isActive && step.status === ItemStatus.WAITING_CONFIRMATION && currentUser.id === item.senderId && (
                              <button
                                onClick={handleConfirmReceipt}
                                className="mt-2 bg-[#009E49] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg shadow-green-200 hover:bg-[#007A38] transition animate-bounce"
                              >
                                Confirm Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Logistics Block */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>

            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black tracking-tight">Fulfillment Context</h3>
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Telemetry</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <p className="text-[#009E49] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Recipient Protocol</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{item.receiverName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Receiver</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-white tracking-widest">{item.receiverPhone}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Validated Contact</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Sender Directive</p>
                  <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
                    "{item.notes || "No operational constraints specified for this shipment node."}"
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-[#009E49] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Node Addresses</p>
                  <div className="space-y-6">
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 w-2 h-2 rounded-full border-2 border-green-400"></div>
                      <div className="absolute left-[3px] top-3 bottom-[-20px] w-px bg-white/10"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pickup point</p>
                      <p className="text-sm font-black text-white">{item.address}</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 w-2 h-2 rounded-full border-2 border-[#FDD100]"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery point</p>
                      <p className="text-sm font-black text-white">Local Hub Distribution, {item.destCountry}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#009E49]/10 rounded-3xl border border-[#009E49]/20">
                  <div className="flex gap-3 items-center mb-2">
                    <svg className="w-5 h-5 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#009E49]">Financial Security</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Rewards are held in escrow. Release payment of <strong>{item.fee.toLocaleString()} ETB</strong> only upon successful handover validation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Participants */}
        <div className="lg:col-span-4 space-y-6">

          {/* Completion Celebration (If delivered) */}
          {isDelivered && (
            <div className="bg-[#009E49] p-8 rounded-[2.5rem] shadow-xl text-white text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2">Delivery Completed</h3>
              <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-6 leading-relaxed">The fulfillment sequence for this node is now finalized and archived.</p>
              <button className="w-full py-3 bg-white text-[#009E49] font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-green-900/20 hover:scale-[1.02] transition-transform">
                Download Manifest PDF
              </button>
            </div>
          )}

          {/* Sender */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Shipment Sender</p>
            {item.sender ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img src={item.sender.avatar} className="w-14 h-14 rounded-2xl border border-slate-100 object-cover shadow-sm" alt={item.sender.firstName} />
                  <div className="space-y-0.5">
                    <p className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-tighter text-sm">
                      {item.sender.firstName} {item.sender.lastName}
                      {item.sender.verificationStatus === VerificationStatus.VERIFIED && (
                        <svg className="w-3.5 h-3.5 text-[#009E49]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      )}
                    </p>
                    <div className="flex items-center text-amber-500 text-[10px] font-black">
                      <svg className="w-3 h-3 fill-current mr-1" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {item.sender.rating || '4.9'} <span className="text-slate-400 ml-1 opacity-70">SENDER TRUST</span>
                    </div>
                  </div>
                </div>
                {item.sender.id !== currentUser.id && (
                  <button onClick={() => handleMessage(item.sender!.id)} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Send Message
                  </button>
                )}
              </div>
            ) : (
              <div className="py-10 bg-slate-50/50 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Metadata Restricted</p>
              </div>
            )}
          </div>

          {/* Picker */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Assigned Partner</p>
            {item.partner ? (
              <div className="space-y-6">
                <div
                  className="flex items-center gap-4 cursor-pointer group/profile"
                  onClick={() => navigate(`/picker-profile/${item.partner!.id}`)}
                >
                  <img src={item.partner.avatar} className="w-14 h-14 rounded-2xl border border-slate-100 object-cover shadow-sm group-hover/profile:scale-105 transition-transform" alt={item.partner.firstName} />
                  <div className="space-y-0.5">
                    <p className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-tighter text-sm group-hover/profile:text-[#009E49] transition-colors">
                      {item.partner.firstName} {item.partner.lastName}
                      {item.partner.verificationStatus === VerificationStatus.VERIFIED && (
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.15c.567.347 1.343.347 1.91 0l6.863-4.25A2 2 0 0015.937 3H4.063c-.833 0-1.545.51-1.897 1.9zm15.734 2.8L11.03 11.95a3 3 0 01-3.09 0L1.1 7.7A2 2 0 001 9v7a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-.1-.3z" /></svg>
                      )}
                    </p>
                    <div className="flex items-center text-indigo-500 text-[10px] font-black">
                      <svg className="w-3 h-3 fill-current mr-1" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {item.partner.rating || '4.9'} <span className="text-slate-400 ml-1 opacity-70">PARTNER RELIABILITY</span>
                    </div>
                  </div>
                </div>
                {item.partner.id !== currentUser.id && (
                  <button onClick={() => handleMessage(item.partner!.id)} className="w-full py-4 bg-[#009E49] hover:bg-[#007A38] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Contact Partner
                  </button>
                )}
              </div>
            ) : (
              <div className="py-10 bg-slate-50/50 rounded-3xl border border-slate-100 text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                  <div className="w-6 h-6 bg-[#009E49]/20 rounded-full animate-ping" />
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Searching Partner...</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl text-white">
            <div className="flex gap-4 items-start mb-6">
              <div className="bg-white/10 p-2 rounded-xl">
                <svg className="w-5 h-5 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h4 className="font-black uppercase text-[10px] tracking-widest mb-1">Global Support</h4>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium">Node disputes? Contact our L3 support layer for mediation.</p>
              </div>
            </div>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors backdrop-blur-sm">
              Priority Mediator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPage;
