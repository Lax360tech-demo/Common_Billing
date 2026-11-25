import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Printer, Filter, Calendar, Building2, Store } from 'lucide-react';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Invoices = () => {
  const { isSuperAdmin, allBusinesses, selectedBusinessId } = useAuth();
  const { settings } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [businessFilter, setBusinessFilter] = useState(selectedBusinessId || 'all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [status, businessFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'All') params.append('status', status);
      if (businessFilter && businessFilter !== 'all') {
        params.append('business_id', businessFilter);
      }
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/invoices${q}`);
      setInvoices(res.data.items || []);
    } catch (err) {
      console.warn('Invoices load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.phone?.includes(q) ||
      inv.business_name?.toLowerCase().includes(q) ||
      inv.business_category?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.grand_total) || 0), 0);
  const totalPaid = invoices.filter((i) => i.payment_status === 'Paid').length;
  const totalDue = invoices.filter((i) => i.payment_status !== 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              All Invoices & Transactions
            </h1>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60">
                Collective Admin View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isSuperAdmin
              ? 'Complete multi-business ledger, collective transaction audit, and GST tax records across all business billing modules'
              : 'Audit history, reprint thermal receipts, and download GST tax invoices'}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Super Admin Business Module Filter */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              <select
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer focus:outline-indigo-600"
              >
                <option value="all">🏢 All Business Modules ({(allBusinesses || []).length})</option>
                {(allBusinesses || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.category_name || b.category})</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-indigo-600"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Admin KPI Stat Strip */}
      {isSuperAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoices (Collective)</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{invoices.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Billed Volume</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Fully Paid Invoices</p>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{totalPaid}</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Due / Partial Bills</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{totalDue}</p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">Invoice #</th>
                {isSuperAdmin && <th className="p-4">Business Module</th>}
                <th className="p-4">Date & Time</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Taxable</th>
                <th className="p-4 text-right">Tax</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="p-12 text-center text-slate-400">
                    {loading ? 'Loading invoices...' : 'No invoices match your search query.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoice_number}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{inv.business_name || 'Store'}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {inv.business_category || 'General Store'}
                        </span>
                      </td>
                    )}
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {inv.date} <span className="text-[10px] text-slate-400">{inv.time}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.customer?.name || 'Walk-in'}</p>
                      {inv.customer?.phone && <p className="text-[10px] text-slate-400">{inv.customer.phone}</p>}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {inv.item_count || inv.items?.length || 1} items ({inv.total_quantity || 1} units)
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                      {inv.payment_method}
                    </td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.tax_amount)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : inv.payment_status === 'Partial'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {inv.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-indigo-600 font-bold text-xs transition shadow-xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};

export default Invoices;
