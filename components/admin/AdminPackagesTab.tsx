
import React, { useState } from 'react';
import { SubscriptionPlan, UserRole } from '../../types';
import { SubscriptionService } from '../../services/SubscriptionService';

interface AdminPackagesTabProps {
  plans: SubscriptionPlan[];
  onRefresh?: () => void;
}

const AdminPackagesTab: React.FC<AdminPackagesTabProps> = ({ plans, onRefresh }) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.SENDER);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    price: 0,
    coin_price: 0,
    limit: 0,
    role: activeRole,
    description: '',
    is_premium: false,
    duration_days: 30
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      coin_price: 0,
      limit: 0,
      role: activeRole,
      description: '',
      is_premium: false,
      duration_days: 30
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Broadcast deletion signal to all nodes? This tier will be decommissioned.")) return;
    try {
      await SubscriptionService.deletePlan(id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to delete plan", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await SubscriptionService.updatePlan(editingPlan.id, formData);
      } else {
        await SubscriptionService.createPlan(formData);
      }
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to save plan", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlans = plans.filter(p => p.role === activeRole);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* Dense Control Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveRole(UserRole.SENDER)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === UserRole.SENDER ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sender Vectors
            </button>
            <button
              onClick={() => setActiveRole(UserRole.PICKER)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === UserRole.PICKER ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Picker Nodes
            </button>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">
            {filteredPlans.length} Active Prototypes Identified
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="w-full md:w-auto bg-[#009E49] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-green-100 active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          Initialize New Tier
        </button>
      </div>

      {/* Denser Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
            {plan.is_premium && (
              <div className="absolute top-0 right-0">
                <div className="bg-[#009E49] text-white text-[8px] font-black uppercase tracking-[0.2em] px-6 py-1.5 rotate-45 translate-x-[25px] translate-y-[10px] shadow-lg">
                  Premium
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest: {plan.id.substring(0, 8)}</h4>
                <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{plan.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900 flex items-baseline justify-end gap-1">
                  {plan.price.toLocaleString()}
                  <span className="text-[10px] text-slate-400 uppercase">ETB</span>
                </div>
                {plan.coin_price && (
                  <div className="text-sm font-black text-[#009E49] flex items-center justify-end gap-1">
                    {plan.coin_price}
                    <span className="text-[10px] uppercase">λ</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota</p>
                <p className="text-lg font-black text-slate-900">{plan.limit} <span className="text-[10px] text-slate-400 uppercase">Items</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cycle</p>
                <p className="text-lg font-black text-slate-900">{plan.duration_days || 30} <span className="text-[10px] text-slate-400 uppercase">Days</span></p>
              </div>
            </div>

            <div className="flex-1 mb-6">
              <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2">"{plan.description}"</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
              <button
                onClick={() => handleEdit(plan)}
                className="py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                Refine
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
              >
                Wipe
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Streamlined Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">{editingPlan ? 'Refine Logic' : 'Initialize Node'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Authorized Resource Allocation</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tier Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all"
                    placeholder="e.g. ULTIMATE_SENDER"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vector Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={UserRole.SENDER}>SENDER_NODE</option>
                    <option value={UserRole.PICKER}>PICKER_NODE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fiat (ETB)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#009E49] ml-1">Credit (λ)</label>
                  <input
                    type="number"
                    value={formData.coin_price}
                    onChange={e => setFormData({ ...formData, coin_price: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-slate-50 border border-[#009E49]/20 rounded-2xl font-black text-[#009E49] focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cycle (Days)</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Manifest Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.limit}
                    onChange={e => setFormData({ ...formData, limit: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_premium: !formData.is_premium })}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.is_premium ? 'bg-[#009E49] text-white shadow-xl shadow-green-100' : 'bg-slate-100 text-slate-400'}`}
                  >
                    Premium Node
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description Logic</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 focus:ring-4 focus:ring-[#009E49]/10 outline-none transition-all resize-none"
                  placeholder="Input descriptive benefits vector..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#009E49] shadow-2xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : 'Commit Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackagesTab;
