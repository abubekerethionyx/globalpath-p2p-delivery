
import React, { useState } from 'react';
import { VerificationStatus, ItemStatus } from '../types';
import { UserService } from '../services/UserService';
import { ShipmentService } from '../services/ShipmentService';

// Tab Components
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminItemsTab from '../components/admin/AdminItemsTab';
import AdminPackagesTab from '../components/admin/AdminPackagesTab';
import AdminBillingTab from '../components/admin/AdminBillingTab';
import AdminSupportTab from '../components/admin/AdminSupportTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminNotificationsTab from '../components/admin/AdminNotificationsTab';
import AdminCountriesTab from '../components/admin/AdminCountriesTab';

type AdminTab = 'users' | 'items' | 'packages' | 'billing' | 'support' | 'notifications' | 'settings' | 'countries';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const handleVerify = async (userId: string, status: VerificationStatus) => {
    try {
      if (status === VerificationStatus.VERIFIED) {
        await UserService.verifyUser(userId);
      } else {
        await UserService.updateUser(userId, { verification_status: status } as any);
      }
      // Re-fetching is handled by the tab components internally if they listen for updates
      // or we can pass a refresh trigger if needed, but for now we rely on internal tab state.
    } catch (error) {
      console.error("Failed to update verification status", error);
    }
  };

  const handleUpdateItemStatus = async (id: string, status: ItemStatus) => {
    try {
      await ShipmentService.updateStatus(id, status);
    } catch (error) {
      console.error("Failed to update item status", error);
    }
  };

  const SidebarItem: React.FC<{ tab: AdminTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
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
        return <AdminUsersTab onVerify={handleVerify} />;
      case 'items':
        return <AdminItemsTab onUpdateStatus={handleUpdateItemStatus} />;
      case 'packages':
        return <AdminPackagesTab onRefresh={() => { }} />;
      case 'billing':
        return <AdminBillingTab />;
      case 'settings':
        return <AdminSettingsTab />;
      case 'notifications':
        return <AdminNotificationsTab />;
      case 'countries':
        return <AdminCountriesTab />;
      case 'support':
        return <AdminSupportTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-white h-screen overflow-hidden animate-in fade-in duration-500">
      {/* Admin Sidebar */}
      <div className="w-72 bg-slate-900 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800">
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">GlobalPath Protocol</p>
          <h2 className="text-2xl font-black text-white">Admin Hub</h2>
        </div>
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <SidebarItem tab="users" label="Users & Verification" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <SidebarItem tab="items" label="Shipments" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <SidebarItem tab="packages" label="Packages" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
          <SidebarItem tab="billing" label="Billing" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <SidebarItem tab="support" label="Support" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <SidebarItem tab="notifications" label="Broadcasting" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
          <SidebarItem tab="countries" label="Geographies" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <SidebarItem tab="settings" label="System Protocols" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        </div>
        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Nodes Online</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-10 py-8 flex justify-between items-center z-10 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight leading-none">{activeTab === 'users' ? 'Identity Registry' : activeTab === 'items' ? 'Global Logistics' : activeTab}</h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-2">Node Environment v0.4.2-STABLE</p>
          </div>
          <div className="flex items-center space-x-8">
            {/* Global stats or notifications could go here */}
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Active Since</p>
              <p className="text-sm font-black text-slate-900">2024.10.15</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
