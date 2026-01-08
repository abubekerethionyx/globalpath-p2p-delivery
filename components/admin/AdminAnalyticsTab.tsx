import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Line, ComposedChart,
    RadialBarChart, RadialBar, Cell
} from 'recharts';

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const AdminAnalyticsTab: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const result = await AdminService.getAnalytics();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex h-[600px] items-center justify-center">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-t-4 border-[#009E49] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-indigo-600 rounded-full animate-spin reverse"></div>
                <div className="absolute inset-4 border-b-4 border-amber-500 rounded-full animate-spin-slow"></div>
            </div>
        </div>
    );

    if (!data) return <div className="p-10 text-center font-black text-slate-300 uppercase tracking-widest">No Data Stream</div>;

    // --- Data Preparation ---
    const userDistribution = [
        { name: 'Senders', count: data.users.distribution.senders, fill: '#0088FE' },
        { name: 'Pickers', count: data.users.distribution.pickers, fill: '#00C49F' },
        { name: 'Admins', count: data.users.distribution.admins, fill: '#FFBB28' }
    ];

    const routeData = data.travels.top_routes?.map((r: any) => ({
        name: `${r.origin} ➔ ${r.destination}`,
        value: r.count
    })) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. SECTOR: COMMAND CENTER */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric Card 1: Total Revenue */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#009E49]/20 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-[#009E49]/30 transition-all duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Revenue</p>
                                <h3 className="text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                    ${data.financial.total_revenue.toLocaleString()}
                                </h3>
                            </div>
                            <div className="bg-[#009E49]/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-[#009E49]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-[#009E49] px-2 py-0.5 rounded text-white font-bold">+12%</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">vs last week</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                            <div>
                                <p className="text-[8px] uppercase text-slate-500 font-bold">Logistics</p>
                                <p className="text-xs font-bold">${data.financial.logistics_volume.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] uppercase text-slate-500 font-bold">Subscriptions</p>
                                <p className="text-xs font-bold">${data.financial.subscription_revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Card 2: User Growth */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Base</p>
                            <h3 className="text-3xl font-black mt-1 text-slate-900">{data.users.total.toLocaleString()}</h3>
                        </div>
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${data.users.growth_rate >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}>
                            {data.users.growth_rate}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Growth Delta</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${(data.users.active_proxy / data.users.total) * 100}%` }}></div>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2 font-bold uppercase text-right">{data.users.active_proxy} Active nodes online</p>
                </div>

                {/* Metric Card 3: Network Load */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Load</p>
                            <h3 className="text-3xl font-black mt-1 text-slate-900">{data.travels.network_load}%</h3>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="flex-1">
                            <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Available Capacity</p>
                            <p className="text-sm font-black text-slate-900">{data.travels.capacity_kg.toLocaleString()} kg</p>
                        </div>
                        <div className="flex-1 border-l border-slate-100 pl-4">
                            <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Active Routes</p>
                            <p className="text-sm font-black text-slate-900">{data.travels.active} / {data.travels.total}</p>
                        </div>
                    </div>
                </div>

                {/* Metric Card 4: Conversion */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Success Rate</p>
                            <h3 className="text-3xl font-black mt-1 text-slate-900">{data.logistics.conversion_rate}%</h3>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Posted</p>
                            <p className="text-xs font-black text-slate-900">{data.logistics.total_shipments}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <p className="text-[8px] font-black text-emerald-400 uppercase">Delivered</p>
                            <p className="text-xs font-black text-emerald-700">{data.logistics.delivered}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SECTOR: FINANCIAL & DEMOGRAPHICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Financial Telemetry</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">7-Day Revenue Stream Analysis</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 bg-[#009E49] rounded-full"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Income</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.financial.trend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#009E49" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#009E49" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="value" stroke="#009E49" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <h3 className="text-lg font-black mb-1">Demographics</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">User Roles</p>
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="30%"
                                    outerRadius="100%"
                                    barSize={20}
                                    data={userDistribution}
                                >
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                        background
                                        dataKey="count"
                                    />
                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SECTOR: LOGISTICS OPERATIONS */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Shipment Velocity Dashboard</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Status Lifecycle Analysis</p>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.logistics.status_trend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} />
                            <Bar dataKey="Total" fill="#f8fafc" barSize={60} radius={[10, 10, 0, 0]} name="Total Output" />
                            <Line type="monotone" dataKey="POSTED" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Posted" />
                            <Line type="monotone" dataKey="PICKED" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Picked" />
                            <Line type="monotone" dataKey="DELIVERED" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Delivered" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. SECTOR: NETWORK INTELLIGENCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Route Intelligence */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Global Route Intelligence</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High Demand Corridors</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={routeData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid stroke="#f1f5f9" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} name="Active Travels" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Elite Impact Travelers */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Elite Impact Nodes</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Top Capacity Providers</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {data.travels.top_travelers?.map((traveler: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-500">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{traveler.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{traveler.trips} Missions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-indigo-600">{traveler.total_capacity} kg</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Capacity</p>
                                </div>
                            </div>
                        ))}
                        {(!data.travels.top_travelers || data.travels.top_travelers.length === 0) && (
                            <p className="text-center text-slate-400 text-xs py-10">No impact data available yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsTab;
