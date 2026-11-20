import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(identifier, password);
      showToast('Welcome to Lax360 Billing!', 'success');
      navigate('/dashboard');
    } catch (err) {
      let msg = 'Invalid email/phone or password';
      if (err.response?.data?.detail) {
        msg = Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d) => d.msg).join(', ')
          : err.response.data.detail;
      } else if (err.message === 'Network Error') {
        msg = 'Cannot connect to backend server. Ensure backend is running on port 8000.';
      }
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider) => {
    showToast(`Signing in via ${provider}...`, 'info');
    api.post(`/auth/oauth-callback?provider=${provider}&email=admin@gmail.com&name=Lax360 Staff`)
      .then((res) => {
        localStorage.setItem('lax360_access_token', res.data.access_token);
        localStorage.setItem('lax360_user', JSON.stringify(res.data.user));
        localStorage.setItem('lax360_business', JSON.stringify(res.data.business));
        showToast(`Signed in successfully with ${provider}!`, 'success');
        window.location.href = '/dashboard';
      })
      .catch((err) => {
        showToast('OAuth sign-in simulation note: ' + err.message, 'error');
      });
  };

  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      showToast('Reset token generated: ' + (res.data.token || ''), 'info');
      setForgotToken(res.data.token || '');
      setForgotStep(2);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error requesting reset', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        token: forgotToken,
        new_password: newPassword
      });
      showToast('Password updated! You can now sign in.', 'success');
      setIsForgotOpen(false);
      setForgotStep(1);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error resetting password', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30">
            <Zap className="h-6 w-6 fill-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            LAX<span className="text-indigo-600 dark:text-indigo-400">360</span> BILLING
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Universal Business Billing & POS Management Software
          </p>
        </div>

        {/* Demo Helper Banner */}
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
          <div>
            <p className="font-extrabold text-indigo-900 dark:text-indigo-300">Default Demo Credentials:</p>
            <p className="text-indigo-700 dark:text-indigo-400">admin@gmail.com • password: admin</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIdentifier('admin@gmail.com');
              setPassword('admin');
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email or Phone</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
                placeholder="admin@gmail.com or 9876543210"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Lax360'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* OAuth Buttons */}
        

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
            Register Business
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Account Password</h3>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetToken} className="space-y-3">
                <p className="text-xs text-slate-500">Enter your registered email address to receive a reset token.</p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsForgotOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Cancel</button>
                  <button type="submit" disabled={forgotLoading} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    {forgotLoading ? 'Requesting...' : 'Request Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-slate-500">Enter the reset token provided and your new password.</p>
                <input
                  type="text"
                  required
                  value={forgotToken}
                  onChange={(e) => setForgotToken(e.target.value)}
                  placeholder="RESET-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 4 chars)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setForgotStep(1)} className="px-4 py-2 rounded-xl border text-xs font-bold">Back</button>
                  <button type="submit" disabled={forgotLoading} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    {forgotLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
