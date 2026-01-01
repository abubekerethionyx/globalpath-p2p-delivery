
import React, { useState } from 'react';
import { UserRole } from '../types';
import { AuthService } from '../services/AuthService';
import { MOCK_USERS } from '../constants';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onAuthComplete: (user: any) => void;
  // onNavigate removed, using internal navigation or App routing
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await AuthService.login(formData.email, formData.password);
        if (response.user) {
          onAuthComplete(response.user);
        } else {
          // Fallback if no user object, though catch block usually handles this
          setError("Login failed. Please check credentials.");
        }
      } else {
        if (!role) {
          setError("Please select a role first.");
          setIsLoading(false);
          return;
        }

        // Strict Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
          setError("Please enter a valid email address (e.g., user@example.com).");
          setIsLoading(false);
          return;
        }

        await AuthService.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          is_phone_verified: true, // Auto-verify for demo/registry purposes
          role: role
        });

        // Auto login after registration
        const loginResponse = await AuthService.login(formData.email, formData.password);
        onAuthComplete(loginResponse.user);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Extract detailed error message from backend response
      let backendError = "Authentication failed. Try again.";
      if (err.response) {
        if (err.response.data) {
          if (typeof err.response.data === 'string') backendError = err.response.data;
          else if (err.response.data.message) backendError = err.response.data.message;
          else if (err.response.data.error) backendError = err.response.data.error;
          else backendError = JSON.stringify(err.response.data);
        } else {
          backendError = err.response.statusText;
        }
      } else if (err.message) {
        backendError = err.message;
      }
      setError(backendError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Decorative Side Panel */}
        <div className="md:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-[#009E49] w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-900/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <h2 className="text-3xl font-black leading-tight mb-4">Secure Gateway to Ethiopia</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Join the most trusted P2P delivery network connecting Addis Ababa with the world.</p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex -space-x-3 mb-4">
              {MOCK_USERS.slice(0, 3).map(u => (
                <img key={u.id} src={u.avatar} className="w-10 h-10 rounded-full border-2 border-slate-900" alt="" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-[#009E49] flex items-center justify-center text-[10px] font-bold">+12k</div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Community Verified</p>
          </div>

          {/* Mesh Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#009E49]/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FDD100]/5 blur-[80px] rounded-full"></div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 p-8 md:p-12">
          <div className="flex items-center space-x-8 mb-10 border-b border-slate-100 pb-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${isLogin ? 'text-[#009E49] border-b-2 border-[#009E49]' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${!isLogin ? 'text-[#009E49] border-b-2 border-[#009E49]' : 'text-slate-400'}`}
            >
              Create Account
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose Your Identity</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.SENDER)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center group ${role === UserRole.SENDER ? 'border-[#009E49] bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors ${role === UserRole.SENDER ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-tight">I want to Send</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Sender</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.PICKER)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center group ${role === UserRole.PICKER ? 'border-[#009E49] bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors ${role === UserRole.PICKER ? 'bg-[#009E49] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-tight">I want to Deliver</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Partner</p>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                      <input
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                        placeholder="Dawit"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                      <input
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                        placeholder="Mekonnen"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <input
                      type="tel" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                      placeholder="0911 22 33 44"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black shadow-xl transition-all duration-300 active:scale-95 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Enter Platform' : 'Create My Account')}
            </button>
          </form>

          {isLogin && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-bold text-center mb-4 uppercase tracking-widest">Demo Accounts</p>
              <div className="flex flex-wrap justify-center gap-2">
                {MOCK_USERS.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setFormData({ ...formData, email: u.email, password: 'password' }); }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-[#009E49]/10 hover:border-[#009E49] transition"
                  >
                    {u.firstName} ({u.role})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-6">
        <button onClick={() => navigate('/')} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition">Back to Home</button>
        <span className="text-slate-200">|</span>
        <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition">Contact Support</a>
      </div>
    </div>
  );
};

export default AuthPage;
