import React from 'react';
import { ShipmentItem, ItemStatus, UserRole } from '../types';

import { useNavigate } from 'react-router-dom';
import { MessageService } from '../services/MessageService';

interface ShipmentCardProps {
  item: ShipmentItem;
  role: UserRole;
  onUpdateStatus?: (id: string, status: ItemStatus) => void;
  onPick?: (id: string) => void;
  onChat?: (item: ShipmentItem) => void;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  compact?: boolean;
  isRequested?: boolean;
  requestStatus?: string | null;
  currentUserId?: string;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  item,
  role,
  onUpdateStatus,
  onPick,
  onChat,
  onSelect,
  isSelected = false,
  compact = false,
  isRequested = false,
  requestStatus = null,
  currentUserId
}) => {
  const navigate = useNavigate();

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onChat) {
      onChat(item);
      return;
    }

    let targetUserId: string | null = null;

    if (role === UserRole.PICKER) {
      targetUserId = item.senderId;
    } else if (role === UserRole.SENDER) {
      targetUserId = item.partnerId || null;
    }

    if (targetUserId) {
      try {
        const thread = await MessageService.createThread(targetUserId, item.id);
        navigate('/messages', { state: { threadId: thread.id } });
      } catch (err) {
        console.error("Failed to start conversation", err);
      }
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shipment-detail/${item.id}`);
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.POSTED: return 'bg-blue-500 text-white';
      case ItemStatus.REQUESTED: return 'bg-amber-500 text-white';
      case ItemStatus.APPROVED: return 'bg-amber-600 text-white';
      case ItemStatus.PICKED: return 'bg-indigo-500 text-white';
      case ItemStatus.IN_TRANSIT: return 'bg-purple-500 text-white';
      case ItemStatus.ARRIVED: return 'bg-[#009E49] text-white';
      case ItemStatus.WAITING_CONFIRMATION: return 'bg-orange-500 text-white';
      case ItemStatus.DELIVERED: return 'bg-green-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const statusProgress = {
    [ItemStatus.POSTED]: 10,
    [ItemStatus.REQUESTED]: 20,
    [ItemStatus.APPROVED]: 30,
    [ItemStatus.PICKED]: 45,
    [ItemStatus.IN_TRANSIT]: 65,
    [ItemStatus.ARRIVED]: 85,
    [ItemStatus.WAITING_CONFIRMATION]: 90,
    [ItemStatus.DELIVERED]: 100,
  };

  const displayTitle = item.category || item.description?.substring(0, 25) || "Unnamed Shipment";
  const showChat = onChat || (role === UserRole.PICKER) || (role === UserRole.SENDER && item.partnerId);

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 group relative overflow-hidden cursor-pointer ${isSelected ? 'border-[#009E49] ring-2 ring-[#009E49]/20 shadow-xl' : 'border-slate-200 hover:shadow-2xl hover:-translate-y-2 hover:border-[#009E49]/30'
        }`}
      onClick={handleViewDetails}
    >
      {/* Bulk Selection Checkbox */}
      {onSelect && (
        (role === UserRole.PICKER && item.status !== ItemStatus.POSTED && item.status !== ItemStatus.DELIVERED) ||
        (role === UserRole.SENDER && item.status === ItemStatus.WAITING_CONFIRMATION)
      ) && (
          <div
            className="absolute top-0 left-0 p-5 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(item.id, e.target.checked)}
              className="w-5 h-5 rounded-md border-slate-300 text-[#009E49] focus:ring-[#009E49] cursor-pointer shadow-sm"
            />
          </div>
        )}

      {/* Simplified Card Body (No Image Header) */}
      <div className={`p-5 ${onSelect ? 'pt-12' : ''}`}>

        {/* Header: Status & Fee */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(item.status)}`}>
              {item.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-right leading-none">
            <span className="block text-lg font-black text-[#009E49]">{item.fee.toLocaleString()}</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold">ETB Fee</span>
          </div>
        </div>
        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#009E49] transition-colors truncate" title={displayTitle}>
            {displayTitle}
          </h3>
          {item.description && item.category && (
            <p className="text-xs text-slate-400 truncate mt-1">{item.description}</p>
          )}
        </div>

        {/* Route Visualization - More Compact */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-slate-50 to-green-50 p-3 rounded-2xl border border-slate-100 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">From</p>
            <p className="font-black text-slate-800 truncate text-sm">{item.pickupCountry}</p>
          </div>

          <div className="flex flex-col items-center px-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#009E49]" />
              <div className="h-px w-8 bg-gradient-to-r from-[#009E49] to-[#FDD100]" />
              <svg className="w-4 h-4 text-[#FDD100]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex-1 text-right min-w-0">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">To</p>
            <p className="font-black text-slate-800 truncate text-sm">{item.destCountry}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center text-slate-600 bg-slate-50 p-2.5 rounded-xl">
            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="font-bold">{item.weight} kg</span>
          </div>
          <div className="flex items-center text-slate-600 bg-slate-50 p-2.5 rounded-xl">
            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          {(item.available_pickup_time || item.availablePickupTime) && (
            <div className="col-span-2 flex items-center text-[#009E49] bg-green-50 border border-green-100 p-2.5 rounded-xl">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-bold text-[10px] uppercase tracking-wide">Pickup: {new Date(item.available_pickup_time || item.availablePickupTime || '').toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!compact && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#009E49] to-[#00C55E] h-full rounded-full transition-all duration-700"
              style={{ width: `${statusProgress[item.status]}%` }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {/* View Details Button - Always visible for pickers */}
          {role === UserRole.PICKER && (
            <button
              onClick={handleViewDetails}
              className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-black transition flex items-center justify-center shadow-lg group/btn"
            >
              <svg className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
          )}

          {showChat && (
            <button
              onClick={handleMessage}
              className="flex-none bg-white border-2 border-slate-200 text-slate-700 p-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-[#009E49] transition flex items-center justify-center shadow-sm"
              title="Chat with sender"
            >
              <svg className="w-4 h-4 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}

          {role === UserRole.PICKER && item.status === ItemStatus.POSTED && (onPick || (requestStatus && requestStatus !== 'REJECTED')) && (
            (isRequested || requestStatus === 'PENDING') ? (
              <button
                disabled
                className="flex-1 bg-amber-100 text-amber-600 px-3 py-2 rounded-xl text-xs font-black border-2 border-amber-200 cursor-not-allowed uppercase tracking-wider flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request Pending
              </button>
            ) : requestStatus === 'REJECTED' ? (
              <button
                disabled
                className="flex-1 bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-black border-2 border-red-100 cursor-not-allowed uppercase tracking-wider flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rejected
              </button>
            ) : onPick && (
              <button
                onClick={(e) => { e.stopPropagation(); onPick(item.id); }}
                className="flex-1 bg-[#009E49] text-white px-3 py-2 rounded-xl text-xs font-black hover:bg-[#007A38] transition shadow-lg shadow-green-200 uppercase tracking-wider flex items-center justify-center group/pick"
              >
                <svg className="w-4 h-4 mr-2 group-hover/pick:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Pick Up
              </button>
            )
          )}

          {(item.status === ItemStatus.REQUESTED || item.status === ItemStatus.APPROVED) && role === UserRole.PICKER && (
            (currentUserId && item.partnerId === currentUserId) || requestStatus === 'APPROVED' ? (
              <button
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-black border-2 border-green-600 uppercase tracking-wider flex items-center justify-center shadow-lg shadow-green-200"
                onClick={(e) => { e.stopPropagation(); onUpdateStatus?.(item.id, ItemStatus.PICKED); }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                Ready for Pickup
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold border-2 border-slate-200 cursor-not-allowed flex items-center justify-center uppercase tracking-wider"
              >
                Taken
              </button>
            )
          )}

          {role === UserRole.PICKER && item.status !== ItemStatus.POSTED && item.status !== ItemStatus.REQUESTED && item.status !== ItemStatus.APPROVED && item.status !== ItemStatus.DELIVERED && onUpdateStatus && (
            <select
              value={item.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdateStatus(item.id, e.target.value as ItemStatus)}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#009E49] appearance-none text-center cursor-pointer shadow-sm"
            >
              {Object.values(ItemStatus).map(s => {
                if (role === UserRole.PICKER && s === ItemStatus.DELIVERED) return null;
                return (
                  <option key={s} value={s} disabled={statusProgress[s] <= statusProgress[item.status]}>
                    {s.replace('_', ' ')}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentCard;
