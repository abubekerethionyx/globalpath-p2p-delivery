import React, { useState } from 'react';
import { UserRole } from '../types';
import { AuthService } from '../services/AuthService';
import { MOCK_USERS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

interface AuthPageProps {
  onAuthComplete: (user: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
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
  const [tempGoogleToken, setTempGoogleToken] = useState<string | null>(null);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email.");
      return;
    }
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(formData.email);
      alert("Password reset link sent to your email!");
      setShowForgot(false);
    } catch (err) {
      setError("Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }
    setIsLoading(true);
    try {
      await AuthService.verifyOTP(formData.email, otp);
      alert("Email verified! You can now sign in.");
      setShowOTP(false);
      setIsLogin(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await AuthService.googleLogin(credentialResponse.credential);
      if (response.needs_role) {
        setTempGoogleToken(credentialResponse.credential);
        setFormData({ ...formData, email: response.email || '' });
        setIsLogin(false); // Move to "Create Account" view to show role selection
        alert("Please select your role to complete registration.");
      } else if (response.user) {
        onAuthComplete(response.user);
      }
    } catch (err: any) {
      setError("Google Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showOTP) {
      await handleVerifyOTP(e);
      return;
    }
    if (showForgot) {
      await handleForgot(e);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (tempGoogleToken) {
        if (!role) {
          setError("Please select a role.");
          setIsLoading(false);
          return;
        }
        const response = await AuthService.googleLogin(tempGoogleToken, role);
        if (response.user) {
          onAuthComplete(response.user);
        } else {
          setError("Failed to complete Google registration.");
        }
        return;
      }

      if (isLogin) {
        const response = await AuthService.login(formData.email, formData.password);
        if (response.user) {
          onAuthComplete(response.user);
        } else {
          setError("Login failed.");
        }
      } else {
        if (!role) {
          setError("Please select a role.");
          setIsLoading(false);
          return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
          setError("Invalid email address.");
          setIsLoading(false);
          return;
        }

        await AuthService.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role: role
        });

        setShowOTP(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let backendError = "Auth failed.";
      if (err.response?.data) {
        backendError = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
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

          <div className="absolute top-0 right-0 w-64 h-64 bg-[#009E49]/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FDD100]/5 blur-[80px] rounded-full"></div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 p-8 md:p-12">
          {showOTP ? (
            <div className="mb-10 border-b border-slate-100 pb-2 text-center">
              <h3 className="text-xl font-black text-slate-900">Verify Email</h3>
              <p className="text-sm text-slate-500 mt-1">Enter code sent to {formData.email}</p>
            </div>
          ) : showForgot ? (
            <div className="mb-10 border-b border-slate-100 pb-2">
              <h3 className="text-xl font-black text-slate-900">Reset Password</h3>
              <p className="text-sm text-slate-500 mt-1">Enter your email for instructions.</p>
            </div>
          ) : tempGoogleToken ? (
            <div className="mb-10 border-b border-slate-100 pb-2">
              <h3 className="text-xl font-black text-slate-900">Complete Registration</h3>
              <p className="text-sm text-slate-500 mt-1">Please select your preferred role for {formData.email}</p>
            </div>
          ) : (
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
          )}

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {showOTP ? (
              <div className="space-y-6">
                <input
                  type="text" required maxLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-3xl font-black tracking-[0.5em] focus:ring-2 focus:ring-[#009E49] outline-none transition-all"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button type="button" onClick={() => setShowOTP(false)} className="w-full text-xs font-bold text-slate-400 hover:text-slate-900">Back to Register</button>
              </div>
            ) : (
              <>
                {(!isLogin || tempGoogleToken) && !showForgot && (
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
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!isLogin && !showForgot && !tempGoogleToken && (
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      />
                      <input
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      />
                      <input
                        type="tel" required
                        className="w-full col-span-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                  )}
                  <input
                    type="email" required readOnly={!!tempGoogleToken}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none transition-all ${tempGoogleToken ? 'cursor-not-allowed text-slate-500' : ''}`}
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  {!showForgot && !tempGoogleToken && (
                    <div>
                      <input
                        type="password" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                      {isLogin && <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#009E49] font-bold mt-2 hover:underline">Forgot Password?</button>}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black shadow-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Wait...' : tempGoogleToken ? 'Complete Registration' : showForgot ? 'Send Link' : isLogin ? 'Enter Platform' : 'Create My Account'}
                  </button>

                  {isLogin && !tempGoogleToken && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex items-center w-full">
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                        <span className="px-4 text-[10px] font-black text-slate-300 uppercase">Or</span>
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                      </div>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Login failed")}
                        useOneTap
                        shape="pill"
                        text="continue_with"
                        width="300px"
                      />
                    </div>
                  )}
                </div>

                {(showForgot || tempGoogleToken) && (
                  <button type="button" onClick={() => { setShowForgot(false); setTempGoogleToken(null); setIsLogin(true); }} className="w-full text-slate-500 font-bold text-xs mt-4 hover:text-slate-900">
                    Back to Login
                  </button>
                )}
              </>
            )}
          </form>

          {isLogin && !showForgot && !showOTP && (
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

      <div className="mt-8 flex justify-center space-x-6 text-slate-400 font-bold text-xs">
        <button onClick={() => navigate('/')} className="hover:text-slate-900">Back Home</button>
        <span>|</span>
        <a href="#" className="hover:text-slate-900">Support</a>
      </div>
    </div>
  );
};

export default AuthPage;
