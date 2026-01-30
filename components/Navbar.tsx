import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../services/AuthService';
import { NotificationService, Notification } from '../services/NotificationService';
import { PublicSettings } from '../services/AdminService';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  publicSettings?: PublicSettings;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage, publicSettings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount()
      ]);
      setNotifications(notifs.slice(0, 5));
      setUnreadCount(count);
    } catch (e) { console.error(e); }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  const navLinks = [
    { id: 'feed', label: 'Feed', roles: [UserRole.PICKER, UserRole.SENDER, UserRole.ADMIN, null], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
    { id: 'dashboard', label: 'Dashboard', roles: [UserRole.PICKER, UserRole.SENDER], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'my-travels', label: 'Travels', roles: [UserRole.PICKER], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
    { id: 'marketplace', label: 'Market', roles: [UserRole.PICKER], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    { id: 'messages', label: 'Messages', roles: [UserRole.PICKER, UserRole.SENDER], dot: true, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    { id: 'billing', label: 'Wallet', roles: [UserRole.PICKER, UserRole.SENDER], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'packaging', label: 'Plans', roles: [UserRole.PICKER, UserRole.SENDER, UserRole.ADMIN, null], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
    { id: 'support', label: 'Support', roles: [UserRole.PICKER, UserRole.SENDER, UserRole.ADMIN], icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const allCurrentRoleLinks = navLinks.filter(link => user ? link.roles.includes(user.role) : link.roles.includes(null));

  // Determine primary vs overflow links for desktop based on role complexity
  const isPicker = user?.role === UserRole.PICKER;
  const desktopPrimaryLinks = isPicker
    ? allCurrentRoleLinks.filter(l => ['marketplace', 'my-travels', 'messages', 'dashboard'].includes(l.id))
    : allCurrentRoleLinks.filter(l => !['billing', 'packaging', 'support'].includes(l.id));

  const desktopOverflowLinks = allCurrentRoleLinks.filter(l => !desktopPrimaryLinks.find(pl => pl.id === l.id));

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? 'py-1' : 'py-2'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative flex items-center justify-between transition-all duration-500 px-6 py-2 rounded-[2rem] border border-white/40 shadow-2xl backdrop-blur-2xl ${isScrolled ? 'bg-white/80' : 'bg-white/60'}`}>
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigate('landing')}>
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#009E49] to-[#007a38] rounded-2xl shadow-lg group-hover:rotate-[10deg] transition-all duration-300">
              {/* Modified Path to be more like the generated icon */}
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FDD100] rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-tighter leading-none">GLOBALPATH</span>
              <span className="text-[10px] font-black text-[#009E49] tracking-[0.2em]">ET LOGISTICS</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-white/50">
            {desktopPrimaryLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id)}
                className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 rounded-xl ${currentPage === link.id ? 'text-white bg-slate-900 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
              >
                {link.icon}
                <span className="relative z-10">{link.label}</span>
                {link.id === 'messages' && publicSettings?.require_subscription_for_chat && !user?.isSubscriptionActive && user?.role !== UserRole.ADMIN && (
                  <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                )}
                {link.dot && currentPage !== link.id && (!publicSettings?.require_subscription_for_chat || user?.isSubscriptionActive || user?.role === UserRole.ADMIN) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF3340] rounded-full ring-2 ring-white"></span>
                )}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('login')}
                  className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all"
                >
                  Join
                </button>
                <button
                  onClick={() => handleNavigate('login')}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-[1.05] active:scale-95 transition-all"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Credits Pill */}
                <div
                  onClick={() => handleNavigate('packaging')}
                  className="hidden sm:flex items-center gap-2 pl-3 pr-4 py-1.5 bg-indigo-50/50 hover:bg-indigo-100/70 border border-indigo-100 rounded-full transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded-full text-[10px] font-black group-hover:rotate-[360deg] transition-transform duration-500">λ</div>
                  <span className="text-[10px] font-black text-indigo-700">{(user.coinsBalance ?? 0).toLocaleString()}</span>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsProfileOpen(false);
                    }}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${isNotifOpen ? 'bg-slate-900 text-white shadow-xl rotate-12' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#EF3340] text-white text-[8px] font-black items-center justify-center ring-2 ring-white">
                          {unreadCount}
                        </span>
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="fixed inset-x-4 top-24 md:absolute md:inset-x-auto md:top-full md:right-0 md:mt-4 md:w-80 z-[101]">
                      <div className="fixed inset-0 z-[-1]" onClick={() => setIsNotifOpen(false)}></div>
                      <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                        <div className="p-6 bg-slate-900/5 backdrop-blur-sm flex justify-between items-center border-b border-white/50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Transmissions</span>
                          {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-[9px] font-black text-[#009E49] hover:underline uppercase">Clear All</button>}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-10 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-50">Freq Clear</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} onClick={() => { if (n.link) handleNavigate(n.link.replace('/', '')); handleMarkAsRead(n.id); setIsNotifOpen(false); }} className={`p-5 border-b border-white/40 hover:bg-white/60 transition-colors cursor-pointer relative ${!n.is_read ? 'bg-indigo-50/30' : ''}`}>
                                {!n.is_read && <div className="absolute top-6 left-2 w-1.5 h-1.5 rounded-full bg-[#009E49]"></div>}
                                <p className="text-[10px] font-black uppercase text-slate-900 mb-1">{n.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <button onClick={() => { handleNavigate('notifications'); setIsNotifOpen(false); }} className="w-full py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 border-t border-white/40 glass">View Full Log</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <div
                    className="p-0.5 rounded-2xl bg-gradient-to-tr from-[#009E49] to-[#FDD100] p-[2px] cursor-pointer hover:shadow-xl hover:scale-[1.05] transition-all duration-300"
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotifOpen(false);
                    }}
                  >
                    <img
                      className="h-10 w-10 rounded-[0.9rem] object-cover border-2 border-white"
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`}
                      alt="Avatar"
                    />
                  </div>

                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-4 w-64 z-[101]">
                      <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                        {/* User Summary */}
                        <div className="p-6 bg-slate-900/5 backdrop-blur-sm border-b border-white/50">
                          <p className="text-sm font-black text-slate-900 leading-none">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] font-black text-[#009E49] uppercase tracking-widest mt-1.5">{user.role} Account</p>
                        </div>

                        <div className="p-2 space-y-1">
                          {/* Overflow Links (Desktop Only) */}
                          <div className="md:block hidden bg-slate-50 rounded-2xl p-1 mb-1">
                            {desktopOverflowLinks.map(link => (
                              <button
                                key={link.id}
                                onClick={() => { handleNavigate(link.id); setIsProfileOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[1.2rem] transition-all text-left ${currentPage === link.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'}`}
                              >
                                <div className={`p-1.5 rounded-lg ${currentPage === link.id ? 'bg-slate-900 text-white' : 'bg-slate-200/50 text-slate-400'}`}>
                                  {link.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Role Switcher */}
                          {user.role !== UserRole.ADMIN && (
                            <button
                              onClick={async () => {
                                const newRole = user.role === UserRole.SENDER ? UserRole.PICKER : UserRole.SENDER;
                                try {
                                  await AuthService.switchRole(newRole);
                                  window.location.reload();
                                } catch (err) {
                                  console.error("Failed to switch role", err);
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${user.role === UserRole.SENDER ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              <div className={`p-2 rounded-lg ${user.role === UserRole.SENDER ? 'bg-amber-200/50' : 'bg-emerald-200/50'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest">
                                {user.role === UserRole.SENDER ? 'Switch to Picker' : 'Switch to Sender'}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() => { handleNavigate('profile'); setIsProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all text-left"
                          >
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Profile Identity</span>
                          </button>

                          <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-left"
                          >
                            <div className="p-2 bg-red-100/50 rounded-lg">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                {isMobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile Bottom Navigation / Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[99] md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute inset-x-4 top-20 bottom-2 bg-white/90 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 p-1">
                  <img className="w-full h-full rounded-2xl object-cover shadow-sm" src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=GP'} alt="Profile" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{user?.firstName || 'Explorer'}</h3>
                  <p className="text-[9px] font-black text-[#009E49] uppercase tracking-widest">{user?.role || 'Guest'} Protocol</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Links Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-3">
              {navLinks.map(link => {
                const isVisible = user ? link.roles.includes(user.role) : link.roles.includes(null);
                if (!isVisible) return null;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavigate(link.id)}
                    className={`p-6 rounded-[2rem] flex flex-col gap-3 items-center justify-center transition-all ${currentPage === link.id ? 'bg-[#009E49] text-white shadow-xl shadow-green-100' : 'bg-slate-50 text-slate-400'}`}
                  >
                    <div className={`p-4 rounded-2xl ${currentPage === link.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      {link.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{link.label}</span>
                  </button>
                );
              })}
              {user && user.role !== UserRole.ADMIN && (
                <button
                  onClick={async () => {
                    const newRole = user.role === UserRole.SENDER ? UserRole.PICKER : UserRole.SENDER;
                    try {
                      await AuthService.switchRole(newRole);
                      window.location.reload();
                    } catch (err) {
                      console.error("Failed to switch role", err);
                    }
                  }}
                  className={`p-6 rounded-[2rem] flex flex-col gap-3 items-center justify-center transition-all ${user.role === UserRole.SENDER ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                  <div className={`p-4 rounded-2xl ${user.role === UserRole.SENDER ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Switch to {user.role === UserRole.SENDER ? 'Picker' : 'Sender'}
                  </span>
                </button>
              )}
              {user && (
                <button onClick={() => handleNavigate('profile')} className={`p-6 rounded-[2rem] flex flex-col gap-3 items-center justify-center ${currentPage === 'profile' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <div className={`p-4 rounded-2xl ${currentPage === 'profile' ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Account</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50">
              {user ? (
                <button onClick={onLogout} className="w-full py-5 bg-red-50 text-[#EF3340] rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Sign Out
                </button>
              ) : (
                <button onClick={() => handleNavigate('login')} className="w-full py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-2xl">
                  Initiate Connection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
