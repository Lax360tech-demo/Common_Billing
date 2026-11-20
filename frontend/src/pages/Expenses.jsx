import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Calendar, Trash2, RefreshCw, Wallet, TrendingDown } from 'lucide-react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ExpenseModal } from '../components/expenses/ExpenseModal';

export const Expenses = () => {
  const { showToast } = useApp();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses?limit=100');
      setExpenses(res.data.items || []);
    } catch (err) {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast('Expense deleted', 'success');
      fetchExpenses();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const categories = ['All', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Maintenance', 'Office Supplies', 'Transport', 'Other'];

  const filtered = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const desc = (e.description || '').toLowerCase();
    const ref = (e.reference || '').toLowerCase();
    return matchesCat && (desc.includes(q) || ref.includes(q));
  });

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Group by category for top expense
  const catTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  let topCat = '-';
  let topAmount = 0;
  for (const [cat, amt] of Object.entries(catTotals)) {
    if (amt > topAmount) {
      topAmount = amt;
      topCat = cat;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Record and track store overheads, utilities, salaries, and daily operational costs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpenses}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black text-xs font-black shadow-lg transition-all hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: 'var(--theme-primary, #4f46e5)',
              color: '#000000'
            }}
          >
            <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="text-black font-black">Record Expense</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{expenses.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Spend Category</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{topCat} <span className="text-xs font-normal text-slate-400">({formatCurrency(topAmount)})</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-[var(--primary-color)] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">Loading expenses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">No expenses found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-medium">{formatDate(item.date || item.created_at)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{item.description}</td>
                    <td className="py-3 px-4 text-slate-500">{item.payment_method || 'Cash'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{item.reference || '-'}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-500">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Delete"
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
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchExpenses}
        />
      )}
    </div>
  );
};

export default Expenses;
