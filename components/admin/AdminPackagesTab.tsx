
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
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    price: 0,
    limit: 0,
    role: UserRole.SENDER,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      limit: 0,
      role: UserRole.SENDER,
      description: ''
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
    if (!window.confirm("Are you sure you want to delete this package?")) return;
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900">Subscription Tiers</h2>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
        >
          Add New Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 relative group hover:border-indigo-600 transition-all shadow-sm hover:shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg mb-3 inline-block tracking-widest ${plan.role === UserRole.SENDER ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                  {plan.role}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{plan.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{plan.price.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per Month</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Limit</span>
                <span className="text-lg font-black text-slate-900">{plan.limit} <span className="text-[10px] text-slate-400">Items</span></span>
              </div>

              <div className="min-h-[60px]">
                <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{plan.description}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(plan)}
                  className="py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-indigo-600 hover:text-indigo-600 transition"
                >
                  Edit Configuration
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition"
                >
                  Delete Tier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative">
            <h3 className="text-2xl font-black text-slate-900 mb-8">
              {editingPlan ? 'Refine Package' : 'Create New Tier'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="e.g. Premium Plus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value={UserRole.SENDER}>Sender</option>
                    <option value={UserRole.PICKER}>Picker / Traveler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Price (ETB)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.limit}
                    onChange={e => setFormData({ ...formData, limit: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  placeholder="Describe the benefits of this tier..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : 'Deploy Changes'}
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
