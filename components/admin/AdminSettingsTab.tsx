import React, { useState, useEffect } from 'react';
import { AdminService, AdminSettings } from '../../services/AdminService';
import { SubscriptionService } from '../../services/SubscriptionService';
import { SubscriptionPlan, UserRole } from '../../types';
import api from '../../services/api';

const AdminSettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<AdminSettings>({});
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        Promise.all([fetchSettings(), fetchPlans()]);
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await SubscriptionService.getPlans();
            setPlans(data);
        } catch (err) {
            console.error("Failed to fetch plans", err);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await AdminService.getSettings();
            // Ensure defaults for specific keys if they don't exist
            const defaults: AdminSettings = {
                require_subscription_for_details: { value: 'false', description: 'Block shipment detail viewing if no active subscription' },
                require_subscription_for_chat: { value: 'false', description: 'Block chatting if no active subscription' },
                require_otp_for_signup: { value: 'true', description: 'Require email OTP verification for new accounts' },
                enable_free_promo_sender: { value: 'true', description: 'Enable free welcome plan for new Senders' },
                enable_free_promo_picker: { value: 'true', description: 'Enable free welcome plan for new Pickers' },
                free_promo_sender_plan_id: { value: '', description: 'Select the promotional plan for Senders' },
                free_promo_picker_plan_id: { value: '', description: 'Select the promotional plan for Pickers' },
                enable_google_login: { value: 'true', description: 'Enable third-party authentication via Google' },
                maintenance_interval_hours: { value: '24', description: 'System maintenance cycle interval in hours' }
            };
            setSettings({ ...defaults, ...data });
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string) => {
        const currentVal = settings[key]?.value;
        const newVal = currentVal === 'true' || currentVal === true ? 'false' : 'true';
        setSettings({
            ...settings,
            [key]: { ...settings[key], value: newVal }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await AdminService.updateSettings(settings);
            setMessage({ type: 'success', text: 'System protocols synchronized successfully.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to broadcast settings to edge nodes.' });
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        {
            title: "Security & Authentication",
            description: "Manage verification thresholds and third-party access protocols.",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            keys: ['require_otp_for_signup', 'enable_google_login']
        },
        {
            title: "Ecosystem Incentives",
            description: "Configure automated welcome gifts and promotional plan assignments.",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
            ),
            keys: ['enable_free_promo_sender', 'free_promo_sender_plan_id', 'enable_free_promo_picker', 'free_promo_picker_plan_id']
        },
        {
            title: "Feature Governance",
            description: "Define gating parameters for premium platform features.",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            keys: ['require_subscription_for_details', 'require_subscription_for_chat']
        },
        {
            title: "System Automations",
            description: "Control background heartbeats and recurring protocol indexing.",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            keys: ['maintenance_interval_hours']
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-slate-900"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400">Sync</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Platform Control Hub</h2>
                    <p className="text-slate-500 font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Authorized Security Level: Root Administrator
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl hover:shadow-slate-400 active:scale-95 disabled:opacity-50"
                >
                    <span className="relative z-10 flex items-center">
                        {saving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Synchronizing...
                            </>
                        ) : 'Broadcasting Changes'}
                    </span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                </button>
            </div>

            {message && (
                <div className={`p-6 rounded-[1.5rem] font-bold text-sm flex items-center shadow-lg animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {message.type === 'success' ? '✓' : '!'}
                    </div>
                    {message.text}
                </div>
            )}

            <div className="space-y-16">
                {categories.map((category, idx) => (
                    <section key={idx} className="space-y-8">
                        <div className="border-l-4 border-slate-900 pl-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                    {category.icon}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{category.title}</h3>
                            </div>
                            <p className="text-slate-500 font-medium max-w-2xl">{category.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {category.keys.map(key => {
                                const info = settings[key];
                                if (!info) return null;

                                const isPlanSelector = key === 'free_promo_sender_plan_id' || key === 'free_promo_picker_plan_id';
                                const isTextInput = key === 'maintenance_interval_hours';
                                const targetRole = key.includes('picker') ? UserRole.PICKER : UserRole.SENDER;
                                const filteredPlans = plans.filter(p => p.role === targetRole);
                                const isToggleActive = String(info.value) === 'true';

                                return (
                                    <div key={key} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-2">
                                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] bg-slate-50 inline-block px-2 py-1 rounded">
                                                    {key.split('_').pop()?.includes('id') ? 'Target Manifest' : 'Global Vector'}
                                                </h4>
                                                <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tighter">
                                                    {key.replace(/_/g, ' ')}
                                                </h3>
                                            </div>
                                            {!isPlanSelector && !isTextInput ? (
                                                <button
                                                    onClick={() => handleToggle(key)}
                                                    className={`w-14 h-8 rounded-full relative transition-all duration-500 ${isToggleActive ? 'bg-[#009E49] shadow-[0_0_15px_-3px_rgba(0,158,73,0.5)]' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 transform ${isToggleActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            ) : isTextInput ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={String(info.value)}
                                                        onChange={(e) => setSettings({ ...settings, [key]: { ...info, value: e.target.value } })}
                                                        className="w-16 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-[#009E49]/10 transition-all"
                                                    />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hrs</span>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select
                                                        value={String(info.value)}
                                                        onChange={(e) => setSettings({ ...settings, [key]: { ...info, value: e.target.value } })}
                                                        className="appearance-none bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 pr-10 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#009E49]/10 transition-all cursor-pointer hover:bg-white"
                                                    >
                                                        <option value="">Pending Allocation</option>
                                                        {filteredPlans.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 h-10 overflow-hidden line-clamp-2 italic">
                                            "{info.description}"
                                        </p>

                                        <div className={`pt-4 border-t border-slate-50 flex items-center justify-between`}>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${(!isPlanSelector && isToggleActive) || (isPlanSelector && info.value) ? 'text-[#009E49]' : 'text-slate-300'}`}>
                                                {!isPlanSelector ? (isToggleActive ? 'Enforced' : 'Dormant') : (info.value ? 'Link Active' : 'Unassigned')}
                                            </span>
                                            {isToggleActive && !isPlanSelector && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute inset-x-8 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Protocol Maintenance</h3>
                        <p className="text-slate-500 font-medium">Manually trigger marketplace indexing and subscription lifecycle tasks.</p>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                await api.post('/admin/maintenance/run');
                                alert("System maintenance protocol executed successfully. Ranking scores recalculated and expired nodes deactivated.");
                            } catch (e) {
                                alert("Maintenance failed: Uplink timeout.");
                            }
                        }}
                        className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-100"
                    >
                        Execute Core sync
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase">Marketplace Indexing</p>
                            <p className="text-[10px] text-slate-500 font-bold">Recalculates scores for Premium & Recency</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase">Node Expiration</p>
                            <p className="text-[10px] text-slate-500 font-bold">Checks and deactivates expired partner sub-protocols</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminSettingsTab;
