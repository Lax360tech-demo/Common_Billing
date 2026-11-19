import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ShoppingBag, DollarSign, Calendar, Eye, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PurchaseModal } from '../components/purchases/PurchaseModal';
import Modal from '../components/common/Modal';

export const Purchases = () => {
  const { showToast } = useApp();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases?limit=100');
      setPurchases(res.data.items || []);
    } catch (err) {
      showToast('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter((p) => {
    const q = searchTerm.toLowerCase();
    const supName = p.supplier_name ? p.supplier_name.toLowerCase() : '';
    const invNo = p.invoice_number ? p.invoice_number.toLowerCase() : '';
    const poNo = p.po_number ? p.po_number.toLowerCase() : '';
    return supName.includes(q) || invNo.includes(q) || poNo.includes(q);
  });

  const totalPurchases = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
  const totalBalance = totalPurchases - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Purchase Inwards</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Record stock inward from vendors, track purchase bills and vendor payables</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchases}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold shadow-lg shadow-[var(--primary-color)]/25 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Inward Purchase
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Purchases</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(totalPurchases)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vendor Balance</p>
            <p className="text-xl font-black text-rose-500 mt-1">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vendor name, invoice #, purchase order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">PO / Inv Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">Loading purchases...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">No purchases recorded yet</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const balance = (item.total_amount || 0) - (item.paid_amount || 0);
                  const isPaid = balance <= 0.01;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.po_number || item.invoice_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.purchase_date || item.created_at)}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{item.supplier_name || 'Vendor'}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{item.items?.length || 0} product(s)</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.total_amount)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(item.paid_amount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-500">{formatCurrency(balance)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {isPaid ? 'PAID' : 'DUE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedPurchase(item)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {isModalOpen && (
        <PurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchPurchases}
        />
      )}

      {/* Detail Modal */}
      {selectedPurchase && (
        <Modal
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Order: ${selectedPurchase.po_number || selectedPurchase.invoice_number}`}
          subtitle={`Supplier: ${selectedPurchase.supplier_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Purchase Date</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedPurchase.purchase_date)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Supplier Invoice Ref</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedPurchase.invoice_number || 'None'}</p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Cost</th>
                    <th className="p-2.5 text-right">Tax %</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPurchase.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">{it.name}</td>
                      <td className="p-2.5 text-center">{it.quantity} {it.unit || ''}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(it.unit_cost)}</td>
                      <td className="p-2.5 text-right font-mono">{it.tax_rate}%</td>
                      <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(it.total || (it.quantity * it.unit_cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between font-bold text-sm">
              <span>Total Inward Amount:</span>
              <span className="text-[var(--primary-color)]">{formatCurrency(selectedPurchase.total_amount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchases;
