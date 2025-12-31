import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { COUNTRIES, CATEGORIES } from '../constants';
import { ShipmentService } from '../services/ShipmentService';
import { SubscriptionService } from '../services/SubscriptionService';
import { SubscriptionTransaction } from '../types';
import { useNavigate } from 'react-router-dom';

interface PostShipmentPageProps {
  user: User;
}

const PostShipmentPage: React.FC<PostShipmentPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState<SubscriptionTransaction | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [form, setForm] = useState({
    category: '',
    description: '',
    pickupCountry: COUNTRIES[0],
    destCountry: COUNTRIES[1],
    address: '',
    receiverName: '',
    receiverPhone: '',
    weight: 1,
    fee: 500,
    notes: ''
  });

  useEffect(() => {
    SubscriptionService.getUserTransactions(user.id).then(txs => {
      const active = txs.find(t => t.is_active);
      setActiveSub(active || null);
      setLoadingQuota(false);
    }).catch(() => setLoadingQuota(false));
  }, [user.id]);

  const remainingPosts = activeSub?.remaining_usage ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingPosts <= 0) {
      alert("Monthly Posting Quota Exceeded! Please upgrade your plan.");
      return;
    }
    try {
      await ShipmentService.createShipment({ ...form });
      alert("Shipment Posted Successfully!");
      navigate('/dashboard');
    } catch (e) {
      alert("Failed to post shipment. Check your network or quota.");
    }
  };

  const onCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto animate-in">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-3xl font-bold mb-2">Create New Shipment</h2>
        <div className="flex justify-between items-start mb-8">
          <p className="text-slate-500">Ship from Ethiopia or globally. Enter details clearly.</p>
          {!loadingQuota && (
            <div className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide ${remainingPosts > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {remainingPosts} Posts Remaining
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category (Optional)</label>
              <select className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">No Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Weight (kg)</label>
              <input type="number" step="0.1" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.weight} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Item Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Red habesha dress with gold embroidery"
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">From</label>
              <select className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.pickupCountry} onChange={e => setForm({ ...form, pickupCountry: e.target.value })}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">To</label>
              <select className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.destCountry} onChange={e => setForm({ ...form, destCountry: e.target.value })}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Exact Pickup Address (e.g., Subcity, Woreda)</label>
            <input type="text" placeholder="Bole Subcity, Woreda 03, Addis Ababa" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.address} required onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Recipient Full Name</label>
              <input type="text" placeholder="Full Name" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.receiverName} required onChange={e => setForm({ ...form, receiverName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Recipient Phone</label>
              <input type="tel" placeholder="+251..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.receiverPhone} required onChange={e => setForm({ ...form, receiverPhone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Delivery Fee (ETB)</label>
            <input type="number" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.fee} onChange={e => setForm({ ...form, fee: parseInt(e.target.value) })} />
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">The amount you will pay the picker (via Telebirr or Cash).</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Additional Instructions</label>
            <textarea rows={3} placeholder="Fragile, habesha dress, spices, etc..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-[#009E49] text-white rounded-2xl font-bold hover:bg-[#007A38] transition shadow-lg shadow-green-100">Post Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostShipmentPage;
