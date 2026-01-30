import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole, VerificationStatus } from './types';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { AdminService, PublicSettings } from './services/AdminService';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/ToastContext';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import BillingPage from './pages/BillingPage';
import PostShipmentPage from './pages/PostShipmentPage';
import PackagingPage from './pages/PackagingPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';
import PickerProfilePage from './pages/PickerProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AdminLoginPage from './pages/AdminLoginPage';

import { GoogleOAuthProvider } from '@react-oauth/google';

import FeedPage from './pages/FeedPage';
import MyTravelsPage from './pages/MyTravelsPage';
import TravelDetailPage from './pages/TravelDetailPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicSettings, setPublicSettings] = useState<PublicSettings>({
    require_subscription_for_details: false,
    require_subscription_for_chat: false,
    chat_request_status_required: 'REQUESTED',
    require_otp_for_signup: true,
    enable_free_promo_sender: true,
    enable_free_promo_picker: true,
    enable_google_login: true,
    remove_shipment_address_restriction: false
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Placeholder Google Client ID - Replace with your own
  const GOOGLE_CLIENT_ID = "40182803174-dijfcrlpuu2du8ptq8hiha4e57h7pirf.apps.googleusercontent.com";

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await AuthService.getCurrentUser();

      // Fetch public settings in parallel with user profile
      const settingsPromise = AdminService.getPublicSettings().catch(err => {
        console.error("Failed to fetch public settings", err);
        return null;
      });

      if (currentUser) {
        try {
          const [freshUser, settings] = await Promise.all([
            UserService.getProfile(),
            settingsPromise
          ]);
          setUser(freshUser);
          if (settings) setPublicSettings(settings);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          setUser(currentUser);
          const settings = await settingsPromise;
          if (settings) setPublicSettings(settings);
        }
      } else {
        setUser(null);
        const settings = await settingsPromise;
        if (settings) setPublicSettings(settings);
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
      navigate('/marketplace');
    } else {
      navigate('/dashboard');
    }
  };

  // Helper to get current page name for Navbar highlight
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/' || path === '/landing') return 'landing';
    if (path.includes('feed')) return 'feed';
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

  // Role-Based Protected Route Component
  const ProtectedRoute: React.FC<{
    element: React.ReactElement;
    allowedRoles?: UserRole[];
  }> = ({ element, allowedRoles }) => {
    if (!user) return <Navigate to="/login" state={{ from: location }} />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard if role not allowed
      return <Navigate to="/dashboard" />;
    }

    return element;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Protocol...</div>;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
          <Navbar
            user={user}
            currentPage={getCurrentPageName()}
            onLogout={handleLogout}
            publicSettings={publicSettings}
            onNavigate={(page) => {
              if (page === 'landing') navigate('/');
              else if (page === 'support') navigate('/support');
              else navigate(`/${page}`);
            }}
          />

          <main className={`flex-1 w-full relative pt-20 ${location.pathname === '/' || location.pathname === '/landing' || location.pathname === '/admin' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />
              <Route path="/login" element={<AuthPage onAuthComplete={handleAuthComplete} publicSettings={publicSettings} />} />
              <Route path="/admin-access" element={<AdminLoginPage onAuthComplete={handleAuthComplete} />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Shared Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage user={user!} publicSettings={publicSettings} />} />} />
              <Route path="/profile" element={<ProtectedRoute element={<ProfilePage user={user!} onUserUpdate={(updatedUser) => setUser(updatedUser)} />} />} />
              <Route path="/notifications" element={<ProtectedRoute element={<NotificationsPage user={user!} />} />} />
              <Route path="/support" element={<ProtectedRoute element={<SupportPage user={user!} />} />} />
              <Route path="/billing" element={<ProtectedRoute element={<BillingPage user={user!} />} />} />
              <Route path="/packaging" element={<ProtectedRoute element={<PackagingPage user={user!} onPlanChanged={refreshUser} />} />} />
              <Route path="/feed" element={<ProtectedRoute element={<FeedPage user={user!} />} />} />

              {/* Picker-Specific Routes */}
              <Route path="/marketplace" element={<ProtectedRoute allowedRoles={[UserRole.PICKER, UserRole.ADMIN]} element={<MarketplacePage user={user!} publicSettings={publicSettings} />} />} />
              <Route path="/my-travels" element={<ProtectedRoute allowedRoles={[UserRole.PICKER, UserRole.ADMIN]} element={<MyTravelsPage user={user!} />} />} />
              <Route path="/picker-profile/:id" element={<ProtectedRoute allowedRoles={[UserRole.PICKER, UserRole.ADMIN, UserRole.SENDER]} element={<PickerProfilePage />} />} />
              <Route path="/travel/:id" element={<ProtectedRoute element={<TravelDetailPage user={user!} />} />} />

              {/* Sender-Specific Routes */}
              <Route path="/post-item" element={<ProtectedRoute allowedRoles={[UserRole.SENDER, UserRole.ADMIN]} element={<PostShipmentPage user={user!} />} />} />
              <Route path="/post-shipment/:id" element={<ProtectedRoute allowedRoles={[UserRole.SENDER, UserRole.ADMIN]} element={<PostShipmentPage user={user!} />} />} />
              <Route path="/shipment-detail/:id" element={<ProtectedRoute element={<ShipmentDetailPage currentUser={user!} publicSettings={publicSettings} />} />} />

              {/* Messages with Subscription Logic */}
              <Route path="/messages" element={
                <ProtectedRoute element={
                  (publicSettings.require_subscription_for_chat && user?.isSubscriptionActive === false && user?.role !== UserRole.ADMIN)
                    ? <Navigate to="/packaging" />
                    : <MessagesPage user={user!} />
                } />
              } />

              {/* Admin-Only Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} element={<AdminPage />} />} />

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
              <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] gap-4">
                <p>© 2026 GlobalPath P2P Logistics.</p>
                <div className="flex items-center gap-1">
                  <span>Built by</span>
                  <a href="https://ethionyx.com/" target="_blank" rel="noopener noreferrer" className="text-[#009E49] hover:underline">EthioNyx</a>
                  <span className="mx-2 text-slate-200">|</span>
                  <button onClick={() => navigate('/admin-access')} className="hover:text-slate-900 transition-colors">Admin Access</button>
                </div>
                <p className="md:mt-0">Connecting Ethiopia to the World 🌍</p>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
