import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { BUSINESS_CATEGORIES } from '../utils/businessCategories';

export const Register = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    business_name: '',
    business_category: 'retail_store',
    address: '',
    gstin: ''
  });
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategoryConfig = BUSINESS_CATEGORIES.find((c) => c.id === formData.business_category) || BUSINESS_CATEGORIES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please accept the Terms & Conditions', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        business_name: formData.business_name,
        business_category: formData.business_category,
        address: formData.address,
        gstin: formData.gstin
      });
      showToast('Business Registered Successfully! Welcome to Lax360 Billing.', 'success');
      navigate('/dashboard');
    } catch (err) {
      let msg = 'Registration failed. Try again.';
      if (err.response?.data?.detail) {
        msg = Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d) => d.msg || `${d.loc?.slice(-1)[0]}: invalid`).join(', ')
          : err.response.data.detail;
      } else if (err.message === 'Network Error') {
        msg = 'Cannot connect to backend server. Ensure backend is running on port 8000.';
      }
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30">
            <Zap className="h-6 w-6 fill-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Register for LAX<span className="text-indigo-600 dark:text-indigo-400">360</span> Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            One Unified Billing & POS System for Any Business Category
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Details */}
          <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Store className="h-4 w-4" />
              <span>Business Profile & Category Selection</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business / Store Name *</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="e.g. Metro Mart & Electronics"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business Category *</label>
                <select
                  required
                  value={formData.business_category}
                  onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-700 dark:text-indigo-300"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Description Banner */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCategoryConfig.name}</p>
                <p className="text-[11px] text-slate-500">{selectedCategoryConfig.description}</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                Units: {selectedCategoryConfig.units.slice(0, 3).join(', ')}...
              </span>
            </div>
          </div>

          {/* User Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Gupta"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="store@example.com"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GSTIN (Optional)</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="29ABCDE1234F1Z5"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 4 characters"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confirm Password *</label>
              <input
                type="password"
                required
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Re-enter password"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="cursor-pointer">
              I accept the <span className="font-bold text-indigo-600">Terms of Service</span> and Universal Billing SaaS privacy agreement.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
          >
            <span>{isSubmitting ? 'Registering Business...' : 'Create Account & Open Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
