import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Package,
  Users,
  Building2,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  Eye,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { ProductModal } from '../components/products/ProductModal';
import { PurchaseModal } from '../components/purchases/PurchaseModal';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Dashboard = () => {
  const { business, categoryConfig } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();

  const [period, setPeriod] = useState('all');
  const [metrics, setMetrics] = useState({
    total_sales: 0,
    period_sales: 0,
    today_revenue: 0,
    total_bills: 0,
    avg_bill_value: 0,
    total_products: 0,
    total_customers: 0,
    total_suppliers: 0,
    low_stock_count: 0,
    pending_payments: 0,
    sales_trend: [],
    payment_breakdown: [],
    top_selling_products: [],
    recent_invoices: []
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/metrics?period=${period}`);
      setMetrics(res.data);
    } catch (err) {
      console.warn('Dashboard metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Business Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Real-time analytics for <strong>{business?.name || 'Your Business'}</strong> ({categoryConfig?.name || 'Retail'})
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={period === tab.id ? { backgroundColor: 'var(--theme-primary, #4f46e5)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => navigate('/pos')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer active:scale-95"
          style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
        >
          <Receipt className="h-4 w-4" />
          <span>New POS Sale (F8)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <Package className="h-4 w-4 text-indigo-600" />
          <span>Add Product</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPurchaseModalOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>Inward Purchase</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="h-4 w-4 text-amber-600" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics.total_sales)}
          icon={TrendingUp}
          subtitle={`${metrics.total_bills} bills finalized`}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(metrics.today_revenue)}
          icon={Receipt}
          subtitle="Real-time daily collection"
        />
        <StatCard
          title="Total Products"
          value={metrics.total_products}
          icon={Package}
          subtitle={`${metrics.low_stock_count} items low on stock`}
        />
        <StatCard
          title="Customer Receivables"
          value={formatCurrency(metrics.pending_payments)}
          icon={Users}
          subtitle={`${metrics.total_customers} registered customers`}
        />
      </div>

      {/* Low Stock Warning Banner if any */}
      {metrics.low_stock_count > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Inventory Alert: {metrics.low_stock_count} Products are Low on Stock
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Replenish inventory via Purchase Order to prevent stockouts at checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/products?low_stock=true')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Review Items
          </button>
        </div>
      )}

      {/* Charts Section: 7-Day Trend & Payment Method Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview AreaChart */}
        <div className="lg:col-span-2 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sales & Bills Overview</h3>
              <p className="text-xs text-slate-400">Past 7 days performance trajectory</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
              Avg Bill: {formatCurrency(metrics.avg_bill_value)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.sales_trend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--theme-primary, #6366f1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--theme-primary, #6366f1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--theme-primary, #6366f1)" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Breakdown PieChart */}
        <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Payment Method Analytics</h3>
            <p className="text-xs text-slate-400">Collections by tender type</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {metrics.payment_breakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.payment_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {metrics.payment_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest customer invoices</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Tender</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics.recent_invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {inv.customer?.name || 'Walk-in'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{inv.item_count || inv.items?.length || 1} items</td>
                    <td className="py-2.5 px-3 text-slate-500">{inv.payment_method}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                        title="View / Reprint Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Top Sold Products</h3>
            <p className="text-xs text-slate-400">Highest grossing catalog items</p>
          </div>

          <div className="space-y-3">
            {metrics.top_selling_products.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No sales recorded yet.</p>
            ) : (
              metrics.top_selling_products.map((tp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{tp.name}</p>
                    <span className="text-[10px] text-slate-400">{tp.quantity} units sold</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {formatCurrency(tp.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}

      {/* Quick Modals */}
      {isProductModalOpen && (
        <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSaved={loadMetrics} />
      )}
      {isPurchaseModalOpen && (
        <PurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} onSaved={loadMetrics} />
      )}
      {isExpenseModalOpen && (
        <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSaved={loadMetrics} />
      )}
    </div>
  );
};

export default Dashboard;
