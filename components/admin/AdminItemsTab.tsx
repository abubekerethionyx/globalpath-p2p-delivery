
import React, { useState, useMemo } from 'react';
import { ShipmentItem, ItemStatus } from '../../types';

interface AdminItemsTabProps {
  items: ShipmentItem[];
  onUpdateStatus: (id: string, status: ItemStatus) => void;
}

const AdminItemsTab: React.FC<AdminItemsTabProps> = ({ items, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pickupCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destCountry.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const getStatusStyle = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.POSTED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ItemStatus.REQUESTED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ItemStatus.PICKED: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case ItemStatus.IN_TRANSIT: return 'bg-purple-50 text-purple-600 border-purple-100';
      case ItemStatus.ARRIVED: return 'bg-green-50 text-green-600 border-green-100';
      case ItemStatus.DELIVERED: return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const statusProgress = {
    [ItemStatus.POSTED]: 15,
    [ItemStatus.REQUESTED]: 30,
    [ItemStatus.PICKED]: 50,
    [ItemStatus.IN_TRANSIT]: 70,
    [ItemStatus.ARRIVED]: 90,
    [ItemStatus.DELIVERED]: 100,
  };

  return (
    <div className="space-y-6">
      {/* Header & Local Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by ID, category, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>{filteredItems.length} Shipments Found</span>
        </div>
      </div>

      {/* Advanced Items List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Shipment Artifact</th>
                <th className="px-8 py-6">P2P Route Map</th>
                <th className="px-8 py-6">Logistics Progress</th>
                <th className="px-8 py-6">Financials</th>
                <th className="px-8 py-6 text-center">Protocol Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">No active shipments match filters</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{item.category}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">ID: #{item.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 leading-none">{item.pickupCountry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Origin</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-px bg-slate-200 relative">
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600"></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-none">{item.destCountry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-48">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${getStatusStyle(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-black text-slate-400">{statusProgress[item.status]}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${statusProgress[item.status]}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#009E49]">{item.fee.toLocaleString()} <span className="text-[10px] text-slate-300">ETB</span></span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.weight} KG Total</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value as ItemStatus)}
                        className="px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all cursor-pointer focus:ring-2 focus:ring-indigo-600 border-none"
                      >
                        {Object.values(ItemStatus).map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminItemsTab;
