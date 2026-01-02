import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
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

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount()
      ]);
      setNotifications(notifs.slice(0, 5)); // Only show last 5 in dropdown
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
    { id: 'dashboard', label: 'Dashboard', roles: [UserRole.PICKER, UserRole.SENDER] },
    { id: 'marketplace', label: 'Marketplace', roles: [UserRole.PICKER] },
    { id: 'messages', label: 'Messages', roles: [UserRole.PICKER, UserRole.SENDER], dot: true },
    { id: 'billing', label: 'Finance', roles: [UserRole.PICKER, UserRole.SENDER] },
    { id: 'support', label: 'Support', roles: [UserRole.PICKER, UserRole.SENDER, UserRole.ADMIN] },
    { id: 'packaging', label: 'Pricing', roles: [UserRole.PICKER, UserRole.SENDER, UserRole.ADMIN, null] },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-b border-slate-100 z-[100] w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <div
              className="flex-shrink-0 flex items-center cursor-pointer group"
              onClick={() => handleNavigate('landing')}
            >
              <div className="bg-[#009E49] p-2.5 rounded-xl mr-3 shadow-lg shadow-green-100 group-hover:rotate-12 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-[#009E49] to-[#FDD100] bg-clip-text text-transparent tracking-tighter sm:block hidden">
                GlobalPath ET
              </span>
            </div>

            {/* Desktop Navigation Links */}
            {user && user.role !== UserRole.ADMIN && (
              <div className="hidden lg:ml-10 lg:flex lg:space-x-4">
                {navLinks.filter(link => link.roles.includes(user.role)).map(link => (
                  <button
                    key={link.id}
                    onClick={() => handleNavigate(link.id)}
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${currentPage === link.id ? 'text-[#009E49] bg-green-50 rounded-lg' : 'text-slate-400 hover:text-slate-900'}`}
                  >
                    {link.label}
                    {link.id === 'messages' && publicSettings?.require_subscription_for_chat && !user.isSubscriptionActive && user.role !== UserRole.ADMIN && (
                      <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    )}
                    {link.dot && (!publicSettings?.require_subscription_for_chat || user.isSubscriptionActive || user.role === UserRole.ADMIN) && <span className="flex h-1.5 w-1.5 rounded-full bg-[#EF3340]"></span>}
                  </button>
                ))}
              </div>
            )}

            {(!user || user.role === UserRole.ADMIN) && (
              <div className="hidden lg:ml-10 lg:flex">
                <button
                  onClick={() => handleNavigate('packaging')}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 'packaging' ? 'text-[#009E49]' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Pricing
                </button>
              </div>
            )}
          </div>

          {/* Right Action Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!user ? (
              <>
                <button
                  onClick={() => handleNavigate('login')}
                  className="hidden sm:block text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-4"
                >
                  Join Partner
                </button>
                <button
                  onClick={() => handleNavigate('login')}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-xl shadow-slate-100"
                >
                  Sign In
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4 lg:border-l lg:pl-6 border-slate-100">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-black text-slate-900 leading-tight">{user.firstName}</span>
                  <span className="text-[8px] text-[#009E49] font-black uppercase tracking-widest">{user.role} Partner</span>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`relative p-2.5 rounded-xl transition-all ${isNotifOpen ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#EF3340] text-white text-[8px] font-black items-center justify-center border border-white">
                          {unreadCount}
                        </span>
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in slide-in-from-top-2">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Notification Hub</h4>
                          {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[9px] font-black text-[#009E49] uppercase tracking-widest hover:underline">Clear Protocol</button>
                          )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">System frequency clear. No pending transmissions.</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  if (notif.link) handleNavigate(notif.link.replace('/', ''));
                                  handleMarkAsRead(notif.id);
                                  setIsNotifOpen(false);
                                }}
                                className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 relative ${!notif.is_read ? 'bg-green-50/30' : ''}`}
                              >
                                {!notif.is_read && <div className="absolute top-6 left-2 w-1.5 h-1.5 rounded-full bg-[#009E49]"></div>}
                                <div className="ml-2">
                                  <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 mb-1">{notif.title}</p>
                                  <p className="text-xs text-slate-500 font-medium leading-tight">{notif.message}</p>
                                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">
                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <button
                          onClick={() => {
                            handleNavigate('notifications');
                            setIsNotifOpen(false);
                          }}
                          className="w-full py-4 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors border-t border-slate-100"
                        >
                          See All Transmissions
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="relative group/profile">
                  <img
                    className="h-10 w-10 rounded-2xl border-2 border-slate-50 shadow-sm cursor-pointer hover:border-[#009E49] transition-all object-cover"
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.firstName}
                    alt="Profile"
                    onClick={() => handleNavigate('profile')}
                  />
                  {user.verificationStatus === 'VERIFIED' && (
                    <div className="absolute -top-1 -right-1 bg-[#009E49] text-white p-0.5 rounded-full border-2 border-white">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="hidden lg:flex text-slate-300 hover:text-[#EF3340] p-2 transition-all hover:bg-red-50 rounded-xl"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[80]"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="lg:hidden fixed inset-x-0 top-20 bg-white z-[90] animate-in fade-in slide-in-from-top-4 duration-300 overflow-y-auto pb-12 shadow-2xl rounded-b-[2.5rem]">
            <div className="px-6 py-8 space-y-2">
              {user ? (
                <>
                  <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] flex items-center gap-4 border border-slate-100">
                    <img
                      className="h-14 w-14 rounded-2xl object-cover border-4 border-white shadow-md"
                      src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.firstName}
                      alt="Profile"
                    />
                    <div>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">{user.firstName} {user.lastName}</h4>
                      <p className="text-[9px] font-black text-[#009E49] uppercase tracking-widest mt-1">{user.role} Partner</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {navLinks.filter(link => !user || (link.roles.includes(user.role))).map(link => (
                      <button
                        key={link.id}
                        onClick={() => handleNavigate(link.id)}
                        className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between group transition-all ${currentPage === link.id ? 'bg-[#009E49] text-white shadow-xl shadow-green-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>
                        <div className="flex items-center gap-3">
                          {link.dot && currentPage !== link.id && <span className="h-2 w-2 rounded-full bg-[#EF3340] animate-pulse"></span>}
                          <svg className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentPage === link.id ? 'text-white' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={() => handleNavigate('profile')}
                      className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all ${currentPage === 'profile' ? 'bg-slate-900 text-white' : ''}`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">Account Registry</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </button>

                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between bg-red-50 text-[#EF3340] hover:bg-red-100 transition-all"
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">Terminate Session</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => handleNavigate('packaging')}
                    className="w-full py-4 rounded-2xl bg-slate-50 text-slate-900 font-black uppercase text-[11px] tracking-widest border border-slate-100"
                  >
                    System Pricing
                  </button>
                  <button
                    onClick={() => handleNavigate('login')}
                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-slate-100"
                  >
                    Access Gateway
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
