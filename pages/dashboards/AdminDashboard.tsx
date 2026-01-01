import React, { useState, useEffect } from 'react';
import { User, ShipmentItem, VerificationStatus, UserRole } from '../../types';
import { ShipmentService } from '../../services/ShipmentService';
import { UserService } from '../../services/UserService';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
    user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [shipments, setShipments] = useState<ShipmentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allUsers, allShipments] = await Promise.all([
                    UserService.getAllUsers(),
                    ShipmentService.getAllShipments()
                ]);
                setUsers(allUsers);
                setShipments(allShipments);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch admin data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    // Calculate stats
    const totalUsers = users.length;
    const senders = users.filter(u => u.role === UserRole.SENDER);
    const pickers = users.filter(u => u.role === UserRole.PICKER);
    const pendingVerifications = users.filter(u => u.verificationStatus === VerificationStatus.PENDING);
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => s.status !== 'DELIVERED');
    const completedShipments = shipments.filter(s => s.status === 'DELIVERED');
    const totalRevenue = shipments.reduce((acc, s) => acc + s.fee, 0);

    return (
        <div className="space-y-8 animate-in pb-24">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Admin Dashboard</h2>
                    <p className="text-slate-500">Platform Overview & Management</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="bg-[#009E49] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#007A38] flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Admin Panel
                </button>
            </div>

            {/* Alerts */}
            {pendingVerifications.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500 p-3 rounded-xl text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{pendingVerifications.length} Pending Verifications</p>
                            <p className="text-sm text-slate-600">Users waiting for identity verification approval</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600"
                    >
                        Review Now
                    </button>
                </div>
            )}

            {/* Platform Stats */}
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Platform Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <p className="text-slate-400 text-xs font-black uppercase mb-2">Total Users</p>
                        <p className="text-3xl font-black text-slate-900">{totalUsers}</p>
                        <p className="text-xs text-slate-500 mt-2">{senders.length} Senders · {pickers.length} Pickers</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <p className="text-slate-400 text-xs font-black uppercase mb-2">Total Shipments</p>
                        <p className="text-3xl font-black text-slate-900">{totalShipments}</p>
                        <p className="text-xs text-slate-500 mt-2">{activeShipments.length} Active · {completedShipments.length} Completed</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <p className="text-slate-400 text-xs font-black uppercase mb-2">Platform Revenue</p>
                        <p className="text-3xl font-black text-[#009E49]">{totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-2">ETB</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <p className="text-slate-400 text-xs font-black uppercase mb-2">Pending Reviews</p>
                        <p className="text-3xl font-black text-amber-500">{pendingVerifications.length}</p>
                        <p className="text-xs text-slate-500 mt-2">Verifications</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Recent Users</h3>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">User</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.slice(0, 10).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatar} className="w-10 h-10 rounded-xl border border-slate-200" alt="" />
                                            <div>
                                                <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white' :
                                            u.role === UserRole.PICKER ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-green-100 text-green-700' :
                                            u.verificationStatus === VerificationStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                            {u.verificationStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#009E49] transition text-left group"
                    >
                        <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition">
                            <svg className="w-6 h-6 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <p className="font-bold text-slate-900">User Management</p>
                        <p className="text-sm text-slate-500 mt-1">Manage users and verifications</p>
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#009E49] transition text-left group"
                    >
                        <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition">
                            <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <p className="font-bold text-slate-900">Shipments</p>
                        <p className="text-sm text-slate-500 mt-1">View all active shipments</p>
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#009E49] transition text-left group"
                    >
                        <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 transition">
                            <svg className="w-6 h-6 text-amber-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <p className="font-bold text-slate-900">Packages</p>
                        <p className="text-sm text-slate-500 mt-1">Manage subscription plans</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
