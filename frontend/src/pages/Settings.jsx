import React, { useState, useEffect } from 'react';
import { 
  Building2, Receipt, Palette, Users, Save, CheckCircle, 
  Trash2, Plus, Moon, Sun, Shield, Lock, Mail, Phone, MapPin, Hash
} from 'lucide-react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { BUSINESS_CATEGORIES } from '../utils/businessCategories';
import { THEMES, THEME_CATEGORIES } from '../data/themes';
import DynamicIcon from '../components/common/DynamicIcon';
import Modal from '../components/common/Modal';

export const Settings = () => {
  const { showToast, business, setBusiness } = useApp();
  const { themeId, changeTheme, mode, toggleMode } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    business_category: 'retail_store',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    currency: '₹',
    invoice_prefix: 'LAX-2026-',
    next_sequence: 1001,
    tax_mode: 'inclusive',
    default_gst_rate: 5,
    default_paper_size: '80mm',
    invoice_footer: 'Thank you for your business! Goods once sold can be exchanged within 7 days.',
  });

  // Theme category filter
  const [themeFilter, setThemeFilter] = useState('all');

  // Staff Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier'
  });

  useEffect(() => {
    fetchSettings();
    if (activeTab === 'staff') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const b = res.data.business || {};
      const bil = res.data.billing || {};
      setFormData({
        business_name: b.name || '',
        business_category: b.category || 'retail_store',
        tagline: b.tagline || '',
        phone: b.phone || '',
        email: b.email || '',
        address: b.address || '',
        city: b.city || '',
        state: b.state || '',
        pincode: b.pincode || '',
        gstin: b.gstin || '',
        currency: b.currency || '₹',
        invoice_prefix: bil.invoice_prefix || 'LAX-2026-',
        next_sequence: bil.next_sequence || 1001,
        tax_mode: bil.pricing_mode || 'inclusive',
        default_gst_rate: bil.default_gst_rate || 5,
        default_paper_size: bil.default_paper_size || '80mm',
        invoice_footer: bil.invoice_footer || 'Thank you for your business! Goods once sold can be exchanged within 7 days.',
      });
    } catch (err) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/settings/users');
      setUsers(res.data.items || []);
    } catch (err) {
      showToast('Failed to load team members', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', formData);
      showToast('Settings saved successfully', 'success');
      // Update global context
      if (setBusiness) {
        setBusiness((prev) => ({
          ...prev,
          name: formData.business_name,
          category: formData.business_category,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          gstin: formData.gstin
        }));
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', newUserData);
      showToast('User added successfully', 'success');
      setIsUserModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/settings/users/${userId}`);
      showToast('User removed', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete user', 'error');
    }
  };

  const filteredThemes = themeFilter === 'all'
    ? THEMES
    : THEMES.filter((t) => t.category === themeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Configure store profile, business vertical, tax preferences, theme, and staff</p>
        </div>
        {activeTab !== 'staff' && activeTab !== 'appearance' && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold shadow-lg shadow-[var(--primary-color)]/25 hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-x-auto text-xs font-bold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'billing' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Billing & GST Taxes
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'appearance' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          Themes & Styling (23)
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'staff' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff & Roles
        </button>
      </div>

      {/* Tab 1: Business Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Business Information</h3>
            <p className="text-xs text-slate-400 mt-0.5">These details will appear on thermal receipts and tax invoices</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business / Store Name *</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="e.g. Lax360 Enterprise Store"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business Category / Industry *</label>
              <select
                value={formData.business_category}
                onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.description.slice(0, 45)}...)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] font-mono"
                placeholder="e.g. 33AABCU9603R1ZX"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="billing@lax360.com"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="₹"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Store Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="Suite 100, Trade Towers, Commercial Complex"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="Chennai"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">State & Pincode</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Tamil Nadu"
                />
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="600001"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Billing & GST Taxes */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Invoice & Taxation Configuration</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control numbering sequence, GST mode, and receipt format</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Invoice Series Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] font-mono"
                placeholder="LAX-2026-"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Next Invoice Sequence #</label>
              <input
                type="number"
                value={formData.next_sequence}
                onChange={(e) => setFormData({ ...formData, next_sequence: parseInt(e.target.value) || 1001 })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pricing Tax Mode</label>
              <select
                value={formData.tax_mode}
                onChange={(e) => setFormData({ ...formData, tax_mode: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                <option value="inclusive">Tax Inclusive (Prices displayed include GST)</option>
                <option value="exclusive">Tax Exclusive (GST calculated on top of price)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Default GST Slab</label>
              <select
                value={formData.default_gst_rate}
                onChange={(e) => setFormData({ ...formData, default_gst_rate: parseFloat(e.target.value) })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Essential Goods)</option>
                <option value={12}>12% (Standard Low)</option>
                <option value={18}>18% (Standard Rate)</option>
                <option value={28}>28% (Luxury / High)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Default POS Printer Format</label>
              <select
                value={formData.default_paper_size}
                onChange={(e) => setFormData({ ...formData, default_paper_size: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                <option value="80mm">80mm Thermal Receipt (Standard POS)</option>
                <option value="58mm">58mm Thermal Receipt (Compact POS)</option>
                <option value="A4">A4 Full Sheet Tax Invoice</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receipt Footer / Terms Note</label>
              <textarea
                rows={2}
                value={formData.invoice_footer}
                onChange={(e) => setFormData({ ...formData, invoice_footer: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Themes & Styling */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Appearance & Color Customizer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Switch between light & dark mode or select from 23 high-end brand palettes</p>
            </div>
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all"
            >
              {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          {/* Theme Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            {THEME_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setThemeFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  themeFilter === cat.id
                    ? 'bg-[var(--primary-color)] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    changeTheme(t.id);
                    showToast(`Theme updated to ${t.name}`, 'info');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-800 dark:text-white">{t.name}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{t.description}</p>
                  
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: t.colors.primary }} title="Primary" />
                    <div className="w-6 h-6 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: t.colors.bgSidebar }} title="Sidebar" />
                    <div className="w-6 h-6 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: t.colors.accent }} title="Accent" />
                    <div className="w-6 h-6 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: t.colors.bgMain }} title="Background" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Staff & Roles */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Store Team Members</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage cashiers, managers, and administrative accounts</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold shadow-lg shadow-[var(--primary-color)]/25 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingUsers ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">Loading staff...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">No additional staff found</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{u.name}</td>
                      <td className="py-3 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {u.role || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add User Modal */}
          {isUserModalOpen && (
            <Modal
              isOpen={isUserModalOpen}
              onClose={() => setIsUserModalOpen(false)}
              title="Add New Staff Member"
              subtitle="Create cashier or manager login credentials"
              maxWidth="max-w-md"
            >
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    placeholder="cashier@lax360.com"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Role / Access Level</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="cashier">Cashier (POS & Invoicing Only)</option>
                    <option value="manager">Manager (Inventory, Products & Sales)</option>
                    <option value="admin">Admin (Full System Access)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--primary-color)] text-white font-bold"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
