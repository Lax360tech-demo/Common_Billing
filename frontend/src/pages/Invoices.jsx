import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Printer, Filter, Calendar } from 'lucide-react';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Invoices = () => {
  const { settings } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [status]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const q = status !== 'All' ? `?status=${status}` : '';
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
      inv.customer?.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            All Invoices & Transactions
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit history, reprint thermal receipts, and download GST tax invoices
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-indigo-600"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">Invoice #</th>
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
                  <td colSpan="10" className="p-12 text-center text-slate-400">
                    No invoices match your search query.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoice_number}
                    </td>
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
