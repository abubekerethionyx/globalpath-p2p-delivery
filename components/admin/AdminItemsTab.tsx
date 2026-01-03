
import React, { useState, useEffect, useCallback } from 'react';
import { ShipmentItem, ItemStatus } from '../../types';
import { ShipmentService } from '../../services/ShipmentService';
import { debounce } from 'lodash';

interface AdminItemsTabProps {
  onUpdateStatus: (id: string, status: ItemStatus) => void;
}

const AdminItemsTab: React.FC<AdminItemsTabProps> = ({ onUpdateStatus }) => {
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchItems = async (page: number, search: string, status: string) => {
    setLoading(true);
    try {
      const response = await ShipmentService.getAllShipments({
        page,
        per_page: 15,
        search,
        status,
      });
      setItems(response.shipments);
      setTotalPages(response.pages);
      setTotalRecords(response.total);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((page, search, status) => {
      fetchItems(page, search, status);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedFetch(currentPage, searchTerm, filterStatus);
  }, [currentPage, searchTerm, filterStatus, debouncedFetch]);

  const handleStatusChange = async (id: string, status: ItemStatus) => {
    await onUpdateStatus(id, status);
    fetchItems(currentPage, searchTerm, filterStatus);
  };

  const getStatusStyle = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.POSTED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ItemStatus.REQUESTED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ItemStatus.APPROVED: return 'bg-amber-100 text-amber-700 border-amber-200';
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
    [ItemStatus.APPROVED]: 40,
    [ItemStatus.PICKED]: 55,
    [ItemStatus.IN_TRANSIT]: 70,
    [ItemStatus.ARRIVED]: 90,
    [ItemStatus.DELIVERED]: 100,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[300px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by ID, receiver, description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none pr-10"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value="ALL">All Statuses</option>
            {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {totalRecords} Global Shipments
        </div>
      </div>

      {/* Advanced Items List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest text-sm">Traversing Global Nodes...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No shipments detected in current flow</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 border border-slate-100 group-hover:border-indigo-500 overflow-hidden shadow-sm">
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <img src={item.imageUrls[0]} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{item.category}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter mt-1">ID: #{item.id.slice(0, 8).toUpperCase()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400">FROM:</span>
                            <span className="text-[9px] font-black text-indigo-600">{item.sender?.firstName || 'User'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 leading-none">{item.pickupCountry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Origin</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-px bg-slate-200 relative">
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-none">{item.destCountry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Target</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-48">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest shadow-sm ${getStatusStyle(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-black text-slate-400">{statusProgress[item.status]}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${statusProgress[item.status]}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#009E49]">{item.fee.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">ETB</span></span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.weight} KG Mass</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="relative inline-block">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as ItemStatus)}
                          className="pl-4 pr-10 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all cursor-pointer focus:ring-2 focus:ring-indigo-600 border-none appearance-none shadow-lg"
                        >
                          {Object.values(ItemStatus).map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 bg-white w-fit mx-auto p-2 rounded-[2rem] shadow-xl border border-slate-100">
          <button
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all rounded-2xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (totalPages > 7) {
                if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="text-slate-300">...</span>;
                  return null;
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all rounded-2xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminItemsTab;
