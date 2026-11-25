import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  AlertCircle,
  Building2,
  Mail,
  User,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import dayjs from 'dayjs';

export const AuditLogs = () => {
  const { isSuperAdmin, allBusinesses } = useAuth();
  const { showToast } = useApp();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [distinctEmails, setDistinctEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedBusiness, setSelectedBusiness] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedEmail !== 'All') params.append('email', selectedEmail);
      if (selectedAction !== 'All') params.append('action', selectedAction);
      if (selectedBusiness !== 'All') params.append('business_id', selectedBusiness);
      params.append('page', page);
      params.append('limit', limit);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
      if (res.data.distinct_emails) {
        setDistinctEmails(res.data.distinct_emails);
      }
    } catch (err) {
      console.warn('Audit logs load note:', err);
      showToast(err.response?.data?.detail || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedEmail, selectedAction, selectedBusiness, page, showToast]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const loginCount = logs.filter((l) => l.action === 'LOGIN').length;
  const logoutCount = logs.filter((l) => l.action === 'LOGOUT').length;
  const failedCount = logs.filter((l) => l.action === 'LOGIN_FAILED').length;

  const exportCSV = () => {
    if (logs.length === 0) {
      showToast('No logs to export', 'error');
      return;
    }
    const headers = ['Timestamp', 'Mail ID', 'Name', 'Role', 'Business Module', 'Action', 'Status', 'IP Address', 'Device'];
    const rows = logs.map((l) => [
      l.timestamp,
      l.email,
      l.name || '',
      l.role || '',
      `${l.business_name || ''} (${l.business_category || ''})`,
      l.action,
      l.status,
      l.ip_address || '',
      `"${(l.user_agent || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auth_audit_logs_${dayjs().format('YYYY-MM-DD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Login / Logout Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time authentication records, session monitoring, and mail ID activity across all business modules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={loadAuditLogs}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Log Entries</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
          <span className="text-[10px] font-semibold text-slate-400">Logged activities in database</span>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Successful Logins</p>
            <LogIn className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{loginCount}</p>
          <span className="text-[10px] font-semibold text-emerald-600/80">Active user entries</span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Logouts Recorded</p>
            <LogOut className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{logoutCount}</p>
          <span className="text-[10px] font-semibold text-amber-600/80">Clean session terminations</span>
        </div>

        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Tracked Mail IDs</p>
            <Mail className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{(distinctEmails || []).length}</p>
          <span className="text-[10px] font-semibold text-indigo-600/80">Distinct business accounts</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Mail ID, Name, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
          />
        </div>

        {/* Mail ID Filter */}
        <div>
          <select
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-indigo-600"
          >
            <option value="All">All Mail IDs ({(distinctEmails || []).length})</option>
            {(distinctEmails || []).map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
        </div>

        {/* Business Module Filter */}
        <div>
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-indigo-600"
          >
            <option value="All">All Business Modules</option>
            {(allBusinesses || []).map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.category_name || b.category})</option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-indigo-600"
          >
            <option value="All">All Actions (Login & Logout)</option>
            <option value="LOGIN">LOGIN Only</option>
            <option value="LOGOUT">LOGOUT Only</option>
            <option value="LOGIN_FAILED">FAILED Attempts</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Mail ID (Account)</th>
                <th className="p-4">User Details</th>
                <th className="p-4">Business Module</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">IP Address & Device</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    No login or logout activity matches the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isLogin = log.action === 'LOGIN';
                  const isLogout = log.action === 'LOGOUT';
                  const isFailed = log.action === 'LOGIN_FAILED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isLogin
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isLogout
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {isLogin && <LogIn className="h-3.5 w-3.5" />}
                          {isLogout && <LogOut className="h-3.5 w-3.5" />}
                          {isFailed && <AlertCircle className="h-3.5 w-3.5" />}
                          <span>{log.action}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-indigo-600 dark:text-indigo-400">
                            {log.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white font-mono">{log.email}</p>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{log.role || 'user'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{log.name || 'Anonymous'}</p>
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{log.business_name || 'Global System'}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            {log.business_category || 'General Store'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dayjs(log.timestamp).format('DD MMM YYYY, hh:mm:ss A')}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="font-mono font-bold text-slate-600 dark:text-slate-300">{log.ip_address || '127.0.0.1'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs" title={log.user_agent}>
                            {log.user_agent || 'Standard Client'}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
