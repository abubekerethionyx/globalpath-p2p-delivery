import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { COUNTRIES, CATEGORIES } from '../constants';
import { ShipmentService } from '../services/ShipmentService';
import { SubscriptionService } from '../services/SubscriptionService';
import { SubscriptionTransaction } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { BASE_URL } from '../config';

// Helper to get full image URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
};

interface PostShipmentPageProps {
  user: User;
}

const PostShipmentPage: React.FC<PostShipmentPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [activeSub, setActiveSub] = useState<SubscriptionTransaction | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [loadingShipment, setLoadingShipment] = useState(isEditMode);
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
    notes: '',
    availablePickupTime: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    SubscriptionService.getUserTransactions(user.id).then(txs => {
      const active = txs.find(t => t.is_active);
      setActiveSub(active || null);
      setLoadingQuota(false);
    }).catch(() => setLoadingQuota(false));
  }, [user.id]);

  // Load existing shipment data when editing
  useEffect(() => {
    if (isEditMode && id) {
      ShipmentService.getShipment(id).then(shipment => {
        setForm({
          category: shipment.category || '',
          description: shipment.description || '',
          pickupCountry: shipment.pickupCountry,
          destCountry: shipment.destCountry,
          address: shipment.address,
          receiverName: shipment.receiverName,
          receiverPhone: shipment.receiverPhone,
          weight: shipment.weight,
          fee: shipment.fee,
          notes: shipment.notes || '',
          availablePickupTime: shipment.availablePickupTime ? new Date(shipment.availablePickupTime).toISOString().slice(0, 16) : ''
        });
        setExistingImageUrls(shipment.imageUrls || []);
        setLoadingShipment(false);
      }).catch((err) => {
        console.error('Failed to load shipment', err);
        alert('Failed to load shipment data');
        navigate('/dashboard');
      });
    }
  }, [isEditMode, id, navigate]);

  const remainingPosts = activeSub?.remaining_usage ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && remainingPosts <= 0) {
      alert("Monthly Posting Quota Exceeded! Please upgrade your plan.");
      return;
    }

    const formData = new FormData();
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('pickup_country', form.pickupCountry);
    formData.append('dest_country', form.destCountry);
    formData.append('address', form.address);
    formData.append('receiver_name', form.receiverName);
    formData.append('receiver_phone', form.receiverPhone);
    formData.append('weight', form.weight.toString());
    formData.append('fee', form.fee.toString());
    formData.append('notes', form.notes);
    formData.append('availablePickupTime', form.availablePickupTime);

    images.forEach(file => {
      formData.append('images', file);
    });

    try {
      if (isEditMode && id) {
        await ShipmentService.updateShipment(id, formData as any);
        alert("Shipment Updated Successfully!");
      } else {
        await ShipmentService.createShipment(formData as any);
        alert("Shipment Posted Successfully!");
      }
      navigate('/dashboard');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Unknown error occurred';
      alert(isEditMode ? `Failed to update shipment: ${errorMessage}` : `Failed to post shipment: ${errorMessage}`);
    }
  };

  const onCancel = () => {
    navigate('/dashboard');
  };

  if (loadingShipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009E49]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-3xl font-bold mb-2">{isEditMode ? 'Edit Shipment' : 'Create New Shipment'}</h2>
        <div className="flex justify-between items-start mb-8">
          <p className="text-slate-500">{isEditMode ? 'Update your shipment details below.' : 'Ship from Ethiopia or globally. Enter details clearly.'}</p>
          {!isEditMode && !loadingQuota && (
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Item Images</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => {
                  if (e.target.files) {
                    setImages(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm font-bold text-slate-500">
                Click to upload multiple photos (Max 5)
              </span>
            </div>

            {/* Existing Images (Edit Mode) */}
            {isEditMode && existingImageUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-600 mb-2">Current Images:</p>
                <div className="grid grid-cols-4 gap-4">
                  {existingImageUrls.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative group aspect-square">
                      <img
                        src={getImageUrl(url)}
                        alt="existing"
                        className="w-full h-full object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {images.length > 0 && (
              <div>
                {isEditMode && <p className="text-xs font-bold text-slate-600 mb-2">New Images to Upload:</p>}
                <div className="grid grid-cols-4 gap-4">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Available Pickup Time</label>
            <input
              type="datetime-local"
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]"
              value={form.availablePickupTime}
              onChange={e => setForm({ ...form, availablePickupTime: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">When can the traveler pick this up?</p>
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
            <input type="text" placeholder="Bole Sub city, Woreda 03, Addis Ababa" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#009E49]" value={form.address} required onChange={e => setForm({ ...form, address: e.target.value })} />
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
            <button type="submit" className="flex-1 py-4 bg-[#009E49] text-white rounded-2xl font-bold hover:bg-[#007A38] transition shadow-lg shadow-green-100">
              {isEditMode ? 'Update Shipment' : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostShipmentPage;
