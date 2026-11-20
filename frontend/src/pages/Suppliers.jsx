import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react';
import { SupplierModal } from '../components/suppliers/SupplierModal';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency } from '../utils/formatters';

export const Suppliers = () => {
  const { showToast } = useApp();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers?limit=100');
      setSuppliers(res.data.items || []);
    } catch (err) {
      console.warn('Suppliers load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier ${name}?`)) return;
    try {
      await api.delete(`/suppliers/${id}`);
      showToast('Supplier deleted successfully', 'success');
      loadSuppliers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete supplier', 'error');
    }
  };

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.phone?.includes(q) || s.contact_person?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Supplier & Vendor Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage wholesale distributors, procurement sources, and trade payables
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by company, person, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">Supplier / Company</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Phone</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4 text-right">Total Purchases</th>
                <th className="p-4 text-right">Payables Due</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    No suppliers recorded yet. Click "Add Supplier" to register one.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                      {s.contact_person || '-'}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                      {s.phone}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {s.gstin || '-'}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(s.total_purchases)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                      {formatCurrency(s.outstanding_payables)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplier(s);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit Supplier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete Supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier}
        onSaved={loadSuppliers}
      />
    </div>
  );
};

export default Suppliers;
