import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole, VerificationStatus } from './types';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import BillingPage from './pages/BillingPage';
import PostShipmentPage from './pages/PostShipmentPage';
import PackagingPage from './pages/PackagingPage';
import MessagesPage from './pages/MessagesPage';
import PickerRegistrationPage from './pages/PickerRegistrationPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';
import PickerProfilePage from './pages/PickerProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import { GoogleOAuthProvider } from '@react-oauth/google';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Placeholder Google Client ID - Replace with your own
  const GOOGLE_CLIENT_ID = "40182803174-dijfcrlpuu2du8ptq8hiha4e57h7pirf.apps.googleusercontent.com";

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await AuthService.getCurrentUser(); // Assuming this might be async in future, currently sync but safe
      if (currentUser) {
        // Verify with backend if token exists
        try {
          const freshUser = await UserService.getProfile();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          setUser(currentUser); // Fallback
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      const u = await UserService.getProfile();
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    navigate('/');
  };

  const handleAuthComplete = (u: User) => {
    setUser(u);
    if (u.role === UserRole.ADMIN) {
      navigate('/admin');
    } else if (u.role === UserRole.PICKER) {
      if (u.verificationStatus === VerificationStatus.UNVERIFIED) {
        navigate('/registration');
      } else {
        navigate('/marketplace');
      }
    } else {
      navigate('/dashboard');
    }
  };

  // Helper to get current page name for Navbar highlight
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/' || path === '/landing') return 'landing';
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('marketplace')) return 'marketplace';
    if (path.includes('messages')) return 'messages';
    if (path.includes('billing')) return 'billing';
    if (path.includes('packaging')) return 'packaging';
    if (path.includes('post-item')) return 'post-item';
    if (path.includes('profile')) return 'profile';
    if (path.includes('support')) return 'support';
    if (path.includes('notifications')) return 'notifications';
    if (path.includes('login')) return 'login';
    return '';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
        <Navbar
          user={user}
          currentPage={getCurrentPageName()}
          onLogout={handleLogout}
          onNavigate={(page) => {
            if (page === 'landing') navigate('/');
            else if (page === 'support') navigate('/support');
            else navigate(`/${page}`);
          }}
        />

        <main className={`flex-1 w-full relative pt-20 ${location.pathname === '/' || location.pathname === '/landing' || location.pathname === '/admin' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />
            <Route path="/login" element={<AuthPage onAuthComplete={handleAuthComplete} />} />
            <Route path="/packaging" element={<PackagingPage user={user} onPlanChanged={refreshUser} />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/shipment-detail/:id" element={user ? <ShipmentDetailPage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/marketplace" element={user ? <MarketplacePage user={user} /> : <Navigate to="/login" />} />
            <Route path="/billing" element={user ? <BillingPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/post-item" element={user ? <PostShipmentPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/post-shipment/:id" element={user ? <PostShipmentPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/messages" element={user ? <MessagesPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/support" element={user ? <SupportPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <NotificationsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onUserUpdate={(updatedUser) => setUser(updatedUser)} /> : <Navigate to="/login" />} />
            <Route path="/registration" element={user ? <PickerRegistrationPage user={user} onSubmit={(data) => {
              const updatedUser = { ...user, ...data };
              setUser(updatedUser);
              // Optionally update local storage here if needed, though AuthService might handle login persistence
              localStorage.setItem('user', JSON.stringify(updatedUser));
              navigate('/marketplace');
            }} onCancel={() => navigate('/marketplace')} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && user.role === UserRole.ADMIN ? <AdminPage /> : <Navigate to="/dashboard" />} />
            <Route path="/picker-profile/:id" element={user ? <PickerProfilePage /> : <Navigate to="/login" />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-100 py-16 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Footer content remains same, simplified for brevity but keeping structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center">
                  <div className="bg-[#009E49] p-2 rounded-xl mr-3 shadow-lg shadow-green-100">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">GlobalPath <span className="text-[#009E49]">ET</span></span>
                </div>
                <p className="text-lg text-slate-500 max-w-md leading-relaxed font-medium">
                  Global P2P infrastructure for the diaspora. Connect families, ship goods, and earn while you travel—anywhere in the world.
                </p>
              </div>
              {/* Links... */}
            </div>
            <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <p>© 2024 GlobalPath P2P Logistics.</p>
              <p className="mt-4 md:mt-0">Connecting Ethiopia to the World 🌍</p>
            </div>
          </div>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
