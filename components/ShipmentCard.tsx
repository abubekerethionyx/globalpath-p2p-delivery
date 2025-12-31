
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
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  item,
  role,
  onUpdateStatus,
  onPick,
  onChat,
  onSelect,
  isSelected = false,
  compact = false
}) => {
  const navigate = useNavigate();

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onChat) {
      onChat(item);
      return;
    }

    // Determine target user based on role
    let targetUserId: string | null = null;

    // If I am a Picker, I want to message the Sender
    if (role === UserRole.PICKER) {
      targetUserId = item.senderId;
    }
    // If I am a Sender, I want to message the Partner (if exists)
    else if (role === UserRole.SENDER) {
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

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.POSTED: return 'bg-blue-100 text-blue-800';
      case ItemStatus.REQUESTED: return 'bg-amber-100 text-amber-800';
      case ItemStatus.PICKED: return 'bg-indigo-100 text-indigo-800';
      case ItemStatus.IN_TRANSIT: return 'bg-purple-100 text-purple-800';
      case ItemStatus.ARRIVED: return 'bg-[#009E49]/10 text-[#009E49]';
      case ItemStatus.DELIVERED: return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const statusProgress = {
    [ItemStatus.POSTED]: 10,
    [ItemStatus.REQUESTED]: 25,
    [ItemStatus.PICKED]: 40,
    [ItemStatus.IN_TRANSIT]: 65,
    [ItemStatus.ARRIVED]: 85,
    [ItemStatus.DELIVERED]: 100,
  };

  const displayTitle = item.category || item.description?.substring(0, 25) || "Unnamed Shipment";

  // Check if chat should be shown
  const showChat = onChat || (role === UserRole.PICKER) || (role === UserRole.SENDER && item.partnerId);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 group relative overflow-hidden ${isSelected ? 'border-[#009E49] ring-2 ring-[#009E49]/20' : 'border-slate-200 hover:shadow-lg hover:-translate-y-1'
      }`}>
      {/* Bulk Selection Checkbox */}
      {role === UserRole.PICKER && onSelect && item.status !== ItemStatus.POSTED && item.status !== ItemStatus.REQUESTED && item.status !== ItemStatus.DELIVERED && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(item.id, e.target.checked)}
            className="w-5 h-5 rounded-md border-slate-300 text-[#009E49] focus:ring-[#009E49] cursor-pointer"
          />
        </div>
      )}

      <div className={`p-5 ${onSelect ? 'pt-12' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter ${getStatusColor(item.status)}`}>
              {item.status.replace('_', ' ')}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-[#009E49] transition-colors truncate max-w-[150px]" title={displayTitle}>
              {displayTitle}
            </h3>
            {item.description && item.category && (
              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.description}</p>
            )}
          </div>
          <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 text-center min-w-[80px]">
            <span className="text-lg font-black text-[#009E49]">{item.fee.toLocaleString()}</span>
            <p className="text-[9px] text-green-600 uppercase font-bold leading-none text-nowrap">ETB Fee</p>
          </div>
        </div>

        {/* Route Visualization */}
        <div className="relative flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-5">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">From</p>
            <p className="font-extrabold text-slate-800 truncate text-sm">{item.pickupCountry}</p>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="h-px w-8 bg-[#FDD100] relative">
              <div className="absolute -top-1.5 -right-1.5">
                <svg className="w-3 h-3 text-[#FDD100]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 text-right min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">To</p>
            <p className="font-extrabold text-slate-800 truncate text-sm">{item.destCountry}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center text-slate-600 bg-white border border-slate-100 p-2 rounded-lg">
            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="font-bold">{item.weight} kg</span>
          </div>
          <div className="flex items-center text-slate-600 bg-white border border-slate-100 p-2 rounded-lg">
            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {!compact && (
          <div className="w-full bg-slate-100 h-1 rounded-full mb-6">
            <div
              className="bg-[#009E49] h-1 rounded-full transition-all duration-700"
              style={{ width: `${statusProgress[item.status]}%` }}
            />
          </div>
        )}

        <div className="flex space-x-2">
          {showChat && (
            <button
              onClick={handleMessage}
              className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-[#009E49] transition flex items-center justify-center shadow-sm"
            >
              <svg className="w-4 h-4 mr-2 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Chat
            </button>
          )}

          {role === UserRole.PICKER && item.status === ItemStatus.POSTED && onPick && (
            <button
              onClick={() => onPick(item.id)}
              className="flex-1 bg-[#009E49] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#007A38] transition shadow-lg shadow-green-100 uppercase tracking-wider"
            >
              Request to Pick
            </button>
          )}

          {role === UserRole.PICKER && item.status === ItemStatus.REQUESTED && (
            <button
              disabled
              className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold cursor-wait"
            >
              Awaiting Approval
            </button>
          )}

          {role === UserRole.PICKER && item.status !== ItemStatus.POSTED && item.status !== ItemStatus.REQUESTED && item.status !== ItemStatus.DELIVERED && onUpdateStatus && (
            <select
              value={item.status}
              onChange={(e) => onUpdateStatus(item.id, e.target.value as ItemStatus)}
              className="flex-1 bg-white border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#009E49] appearance-none text-center cursor-pointer shadow-sm"
            >
              {Object.values(ItemStatus).map(s => (
                <option key={s} value={s} disabled={statusProgress[s] <= statusProgress[item.status]}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentCard;
