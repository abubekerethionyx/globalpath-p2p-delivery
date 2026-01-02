
import React, { useState, useEffect } from 'react';
import { User, ShipmentItem, SubscriptionPlan, VerificationStatus, ItemStatus } from '../types';
import { UserService } from '../services/UserService';
import { ShipmentService } from '../services/ShipmentService';
import { SubscriptionService } from '../services/SubscriptionService';

// Tab Components
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminItemsTab from '../components/admin/AdminItemsTab';
import AdminPackagesTab from '../components/admin/AdminPackagesTab';
import AdminBillingTab from '../components/admin/AdminBillingTab';
import AdminSupportTab from '../components/admin/AdminSupportTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminNotificationsTab from '../components/admin/AdminNotificationsTab';

type AdminTab = 'users' | 'items' | 'packages' | 'billing' | 'support' | 'notifications' | 'settings';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [allUsers, allItems, allPlans] = await Promise.all([
        UserService.getAllUsers(),
        ShipmentService.getAllShipments(),
        SubscriptionService.getPlans()
      ]);
      setUsers(allUsers);
      setItems(allItems);
      setPlans(allPlans);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    }
    setLoading(false);
  };

  const handleVerify = async (userId: string, status: VerificationStatus) => {
    try {
      await UserService.updateUser(userId, { verification_status: status } as any);
      refreshData();
    } catch (error) {
      console.error("Failed to update verification status", error);
    }
  };

  const handleUpdateItemStatus = async (id: string, status: ItemStatus) => {
    try {
      await ShipmentService.updateStatus(id, status);
      refreshData();
    } catch (error) {
      console.error("Failed to update item status", error);
    }
  };

  const SidebarItem: React.FC<{ tab: AdminTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
      }}
      className={`w-full flex items-center px-6 py-4 text-sm font-bold transition-all ${activeTab === tab
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsersTab users={users} onVerify={handleVerify} />;
      case 'items':
        return <AdminItemsTab items={items} onUpdateStatus={handleUpdateItemStatus} />;
      case 'packages':
        return <AdminPackagesTab plans={plans} onRefresh={refreshData} />;
      case 'billing':
        return <AdminBillingTab users={users} />;
      case 'settings':
        return <AdminSettingsTab />;
      case 'notifications':
        return <AdminNotificationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-white h-screen overflow-hidden animate-in">
      {/* Admin Sidebar */}
      <div className="w-72 bg-slate-900 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800">
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">GlobalPath Protocol</p>
          <h2 className="text-2xl font-black text-white">Admin Hub</h2>
        </div>
        <div className="flex-1 py-4">
          <SidebarItem tab="users" label="Users & Verification" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <SidebarItem tab="items" label="Shipments" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <SidebarItem tab="packages" label="Packages" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
          <SidebarItem tab="billing" label="Billing" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <SidebarItem tab="support" label="Support" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <SidebarItem tab="notifications" label="Broadcasting" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
          <SidebarItem tab="settings" label="System Protocols" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 capitalize leading-tight">{activeTab === 'users' ? 'User Management' : activeTab}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GlobalPath Node Manager 0.4.2</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Total Nodes</p>
                <p className="text-sm font-black text-slate-900">{items.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-100"></div>
            </div>
            {activeTab === 'users' && users.some(u => u.verificationStatus === VerificationStatus.PENDING) && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse border border-amber-200">
                {users.filter(u => u.verificationStatus === VerificationStatus.PENDING).length} Pending Review
              </span>
            )}
            <button onClick={refreshData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
