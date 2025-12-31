
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                {navLinks.filter(link => link.roles.includes(user.role) && link.id !== 'packaging').map(link => (
                  <button
                    key={link.id}
                    onClick={() => handleNavigate(link.id)}
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${currentPage === link.id ? 'text-[#009E49] bg-green-50 rounded-lg' : 'text-slate-400 hover:text-slate-900'}`}
                  >
                    {link.label}
                    {link.dot && <span className="flex h-1.5 w-1.5 rounded-full bg-[#EF3340]"></span>}
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
                  <span className="text-xs font-black text-slate-900 leading-tight">{user.name.split(' ')[0]}</span>
                  <span className="text-[8px] text-[#009E49] font-black uppercase tracking-widest">{user.role} Partner</span>
                </div>
                <div className="relative group/profile">
                  <img
                    className="h-10 w-10 rounded-2xl border-2 border-slate-50 shadow-sm cursor-pointer hover:border-[#009E49] transition-all object-cover"
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}
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
                      src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}
                      alt="Profile"
                    />
                    <div>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">{user.name}</h4>
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
