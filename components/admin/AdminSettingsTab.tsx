import React, { useState, useEffect } from 'react';
import { AdminService, AdminSettings } from '../../services/AdminService';
import { SubscriptionService } from '../../services/SubscriptionService';
import { SubscriptionPlan, UserRole } from '../../types';
import api from '../../services/api';
import { SETTINGS_KEYS } from '../../constants/settings';

const AdminSettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<AdminSettings>({});
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [activeTab, setActiveTab] = useState(0);

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
                [SETTINGS_KEYS.REQUIRE_SUB_FOR_DETAILS]: { value: 'false', description: 'Block shipment detail viewing if no active subscription' },
                [SETTINGS_KEYS.REQUIRE_SUB_FOR_CHAT]: { value: 'false', description: 'Block chatting if no active subscription' },
                [SETTINGS_KEYS.REQUIRE_OTP_FOR_SIGNUP]: { value: 'true', description: 'Require email OTP verification for new accounts' },
                [SETTINGS_KEYS.ENABLE_FREE_PROMO_SENDER]: { value: 'true', description: 'Enable free welcome plan for new Senders' },
                [SETTINGS_KEYS.ENABLE_FREE_PROMO_PICKER]: { value: 'true', description: 'Enable free welcome plan for new Pickers' },
                [SETTINGS_KEYS.FREE_PROMO_SENDER_PLAN_ID]: { value: '', description: 'Select the promotional plan for Senders' },
                [SETTINGS_KEYS.FREE_PROMO_PICKER_PLAN_ID]: { value: '', description: 'Select the promotional plan for Pickers' },
                [SETTINGS_KEYS.ENABLE_GOOGLE_LOGIN]: { value: 'true', description: 'Enable third-party authentication via Google' },
                [SETTINGS_KEYS.MAINTENANCE_INTERVAL]: { value: '24', description: 'System maintenance cycle interval in hours' },
                [SETTINGS_KEYS.REWARD_DAILY_SENDER]: { value: '1', description: 'Coins awarded to active senders daily' },
                [SETTINGS_KEYS.REWARD_DAILY_PICKER]: { value: '5', description: 'Coins awarded to active pickers (>= 3 items) daily' },
                [SETTINGS_KEYS.REWARD_STATUS_CHANGE]: { value: '1', description: 'Coins awarded for each shipment status update' },
                [SETTINGS_KEYS.REWARD_HOLIDAY_BONUS]: { value: '10', description: 'Bonus coins awarded for actions during holidays' },
                [SETTINGS_KEYS.ENABLE_HOLIDAY_MODE]: { value: 'false', description: 'Activate holiday bonus protocols globally' },
                [SETTINGS_KEYS.HOLIDAY_NAME]: { value: 'New Year', description: 'Name of the current holiday for notifications' }
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
        const newVal = String(currentVal) === 'true' ? 'false' : 'true';
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
            setMessage({ type: 'success', text: 'System protocols synchronized.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Synchronization failure.' });
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        {
            title: "Security",
            id: "security",
            description: "Verification protocols & authentication gating.",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            keys: [SETTINGS_KEYS.REQUIRE_OTP_FOR_SIGNUP, SETTINGS_KEYS.ENABLE_GOOGLE_LOGIN]
        },
        {
            title: "Promotions",
            id: "promos",
            description: "Automated onboarding & gift tier assignments.",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
            keys: [SETTINGS_KEYS.ENABLE_FREE_PROMO_SENDER, SETTINGS_KEYS.FREE_PROMO_SENDER_PLAN_ID, SETTINGS_KEYS.ENABLE_FREE_PROMO_PICKER, SETTINGS_KEYS.FREE_PROMO_PICKER_PLAN_ID]
        },
        {
            title: "Governance",
            id: "gov",
            description: "Premium feature gating & membership enforcements.",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
            keys: [SETTINGS_KEYS.REQUIRE_SUB_FOR_DETAILS, SETTINGS_KEYS.REQUIRE_SUB_FOR_CHAT]
        },
        {
            title: "Automation",
            id: "auto",
            description: "Background maintenance & indexing heartbeats.",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            keys: [SETTINGS_KEYS.MAINTENANCE_INTERVAL]
        },
        {
            title: "Incentives",
            id: "rewards",
            description: "Technical credit (λ) yields & seasonal events.",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            keys: [SETTINGS_KEYS.REWARD_DAILY_SENDER, SETTINGS_KEYS.REWARD_DAILY_PICKER, SETTINGS_KEYS.REWARD_STATUS_CHANGE, SETTINGS_KEYS.REWARD_HOLIDAY_BONUS, SETTINGS_KEYS.ENABLE_HOLIDAY_MODE, SETTINGS_KEYS.HOLIDAY_NAME]
        }
    ];

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#009E49] border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase text-slate-400">Syncing</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            {/* Unified Control Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 mb-8 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Ecosystem Uplink</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Root Authorized</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {message && (
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:grayscale"
                    >
                        {saving ? 'Syncing...' : 'Broadcast'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-8 min-h-0">
                {/* Sidebar Navigation */}
                <div className="w-64 flex flex-col gap-2">
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(idx)}
                            className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left ${activeTab === idx ? 'bg-slate-900 text-white shadow-xl translate-x-1' : 'bg-white border border-slate-50 text-slate-400 hover:bg-slate-50'}`}
                        >
                            <div className={`p-2 rounded-lg transition-colors ${activeTab === idx ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white text-slate-400'}`}>
                                {cat.icon}
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{cat.title}</h3>
                                <p className={`text-[9px] font-medium leading-tight mt-0.5 ${activeTab === idx ? 'text-slate-400' : 'text-slate-300'}`}>{cat.description.substring(0, 30)}...</p>
                            </div>
                        </button>
                    ))}

                    <div className="mt-auto p-6 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-green-500/20 rounded-full blur-2xl group-hover:bg-green-500/40 transition-all duration-700"></div>
                        <p className="relative z-10 text-[9px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">Core Maintenance</p>
                        <h4 className="relative z-10 text-xs font-black leading-relaxed mb-4">Manual protocol re-indexing.</h4>
                        <button
                            onClick={async () => {
                                try {
                                    await api.post('/admin/maintenance/run');
                                    alert("Marketplace synchronized.");
                                } catch (e) { alert("Uplink timeout."); }
                            }}
                            className="relative z-10 w-full py-2 bg-white/10 hover:bg-white hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Pulse Sync
                        </button>
                    </div>
                </div>

                {/* Main Settings Grid */}
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-8 scrollbar-hide">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories[activeTab].keys.map(key => {
                            const info = settings[key];
                            if (!info) return null;

                            const isPlanSelector = key === SETTINGS_KEYS.FREE_PROMO_SENDER_PLAN_ID || key === SETTINGS_KEYS.FREE_PROMO_PICKER_PLAN_ID;
                            const isTextInput = [SETTINGS_KEYS.MAINTENANCE_INTERVAL, SETTINGS_KEYS.REWARD_DAILY_SENDER, SETTINGS_KEYS.REWARD_DAILY_PICKER, SETTINGS_KEYS.REWARD_STATUS_CHANGE, SETTINGS_KEYS.REWARD_HOLIDAY_BONUS, SETTINGS_KEYS.HOLIDAY_NAME].includes(key);
                            const isNumberInput = isTextInput && key !== 'holiday_name';
                            const isToggleActive = String(info.value) === 'true';

                            return (
                                <div key={key} className="group bg-white p-5 rounded-3xl border border-slate-100 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[8px] font-black text-[#009E49] uppercase tracking-[0.2em] mb-1">
                                                {key.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-500 leading-normal line-clamp-2 italic mb-4">
                                                "{info.description}"
                                            </p>

                                            <div className="flex items-center gap-3">
                                                {isPlanSelector ? (
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={String(info.value)}
                                                            onChange={(e) => setSettings({ ...settings, [key]: { ...info, value: e.target.value } })}
                                                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-4 focus:ring-[#009E49]/10 transition-all cursor-pointer"
                                                        >
                                                            <option value="">Pending...</option>
                                                            {plans.filter(p => p.role === (key.includes('picker') ? UserRole.PICKER : UserRole.SENDER)).map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                ) : isTextInput ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input
                                                            type="text"
                                                            value={String(info.value)}
                                                            onChange={(e) => setSettings({ ...settings, [key]: { ...info, value: e.target.value } })}
                                                            className={`${isNumberInput ? 'w-16 text-center' : 'flex-1'} bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-[#009E49]/10 transition-all`}
                                                        />
                                                        {isNumberInput && <span className="text-[9px] font-black text-slate-400 uppercase">{key.includes('hours') ? 'Hrs' : 'λ'}</span>}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggle(key)}
                                                        className={`w-12 h-7 rounded-full relative transition-all duration-500 ${isToggleActive ? 'bg-[#009E49]' : 'bg-slate-100'}`}
                                                    >
                                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-500 transform ${isToggleActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                )}

                                                <div className="flex items-center gap-1.5 ml-auto">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isToggleActive || (!isTextInput && !isPlanSelector && isToggleActive) || (isTextInput && info.value) || (isPlanSelector && info.value) ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`} />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-0.5 bg-slate-900/5 group-hover:bg-[#009E49]/20 transition-all" style={{ width: '100%' }}></div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats/Metrics Dense Section (Optional, but looks modern) */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Latency', value: '14ms', color: 'text-green-500' },
                            { label: 'Sync Status', value: 'Optimal', color: 'text-indigo-500' },
                            { label: 'Security', value: 'Level 1', color: 'text-amber-500' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex flex-col items-center justify-center text-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</span>
                                <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsTab;
