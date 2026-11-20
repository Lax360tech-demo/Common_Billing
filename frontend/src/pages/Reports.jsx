import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, DollarSign, TrendingUp, TrendingDown, 
  Package, Receipt, ShieldCheck, RefreshCw, Layers, PieChart, FileSpreadsheet
} from 'lucide-react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const Reports = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [salesData, setSalesData] = useState(null);
  const [plData, setPlData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [invData, setInvData] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [activeTab, period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const res = await api.get(`/reports/sales?period=${period}`);
        setSalesData(res.data);
      } else if (activeTab === 'pl') {
        const res = await api.get('/reports/profit-loss');
        setPlData(res.data);
      } else if (activeTab === 'gst') {
        const res = await api.get('/reports/gst');
        setGstData(res.data);
      } else if (activeTab === 'inventory') {
        const res = await api.get('/reports/inventory-valuation');
        setInvData(res.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const typeMap = {
        sales: 'sales',
        pl: 'profit_loss',
        gst: 'gst',
        inventory: 'inventory'
      };
      const res = await api.get(`/reports/export/excel?report_type=${typeMap[activeTab] || 'sales'}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lax360_${activeTab.toUpperCase()}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Excel report downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to export Excel report', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Reports & Business Analytics</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Financial statements, GST liability breakdown, inventory valuation, and audits</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'sales' && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          )}
          <button
            onClick={loadReportData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting ? 'Generating...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-x-auto text-xs font-bold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'sales' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Sales & Revenue
        </button>
        <button
          onClick={() => setActiveTab('pl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'pl' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('gst')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'gst' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          GST Tax Liability
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-white dark:bg-slate-900 text-[var(--primary-color)] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory Valuation
        </button>
      </div>

      {/* Tab 1: Sales & Revenue */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced Sales</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {formatCurrency(salesData?.total_sales || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {formatNumber(salesData?.invoice_count || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Order Value</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {formatCurrency(salesData?.average_order_value || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Payment Methods Collection</h3>
              <div className="space-y-3">
                {salesData?.payment_breakdown && Object.keys(salesData.payment_breakdown).length > 0 ? (
                  Object.entries(salesData.payment_breakdown).map(([method, amount]) => {
                    const pct = salesData.total_sales > 0 ? ((amount / salesData.total_sales) * 100).toFixed(1) : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300">{method}</span>
                          <span className="text-slate-800 dark:text-white">{formatCurrency(amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary-color)] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No payment data recorded in this period</p>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {salesData?.top_products && salesData.top_products.length > 0 ? (
                  salesData.top_products.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.quantity} sold</p>
                      </div>
                      <p className="font-mono font-bold text-[var(--primary-color)]">{formatCurrency(item.revenue)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No sales recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profit & Loss */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales Revenue</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(plData?.total_revenue || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cost of Goods (COGS)</p>
              <p className="text-xl font-black text-amber-600 mt-1">{formatCurrency(plData?.cogs || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Margin</p>
              <p className="text-xl font-black text-blue-600 mt-1">{formatCurrency(plData?.gross_profit || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Business Profit</p>
              <p className={`text-xl font-black mt-1 ${(plData?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {formatCurrency(plData?.net_profit || 0)}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Financial Summary Breakdown</h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <span className="text-slate-600 dark:text-slate-300">(+) Gross Sales Revenue</span>
                <span className="text-slate-900 dark:text-white font-mono">{formatCurrency(plData?.total_revenue || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-amber-600">
                <span>(-) Cost of Goods Sold</span>
                <span className="font-mono">-{formatCurrency(plData?.cogs || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-bold bg-slate-50/50 dark:bg-slate-800/30 px-3 rounded-lg">
                <span className="text-slate-700 dark:text-slate-200">(=) Gross Profit</span>
                <span className="text-blue-600 font-mono">{formatCurrency(plData?.gross_profit || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-rose-500">
                <span>(-) Operational Overheads & Expenses</span>
                <span className="font-mono">-{formatCurrency(plData?.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-slate-200 dark:border-slate-700 font-black text-sm bg-slate-50 dark:bg-slate-800 px-3 rounded-xl">
                <span>Net Operating Profit / (Loss)</span>
                <span className={`font-mono ${(plData?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formatCurrency(plData?.net_profit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GST Tax Summary */}
      {activeTab === 'gst' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Taxable Turnover</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(gstData?.taxable_value || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CGST Collected</p>
              <p className="text-xl font-black text-blue-600 mt-1">{formatCurrency(gstData?.cgst || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SGST Collected</p>
              <p className="text-xl font-black text-indigo-600 mt-1">{formatCurrency(gstData?.sgst || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total GST Liability</p>
              <p className="text-xl font-black text-[var(--primary-color)] mt-1">{formatCurrency(gstData?.total_tax || 0)}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">GSTR-1 Tax Rate-wise Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Detailed tax breakdown for quarterly / monthly GST filing on the GST portal</p>
            
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Tax Slab Rate</th>
                    <th className="py-3 px-4 text-right">Taxable Turnover</th>
                    <th className="py-3 px-4 text-right">CGST</th>
                    <th className="py-3 px-4 text-right">SGST</th>
                    <th className="py-3 px-4 text-right">IGST</th>
                    <th className="py-3 px-4 text-right">Total Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gstData?.gstr1_summary && gstData.gstr1_summary.length > 0 ? (
                    gstData.gstr1_summary.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{row.rate}% GST</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(row.taxable_value)}</td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600">{formatCurrency(row.cgst)}</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600">{formatCurrency(row.sgst)}</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600">{formatCurrency(row.igst || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[var(--primary-color)]">{formatCurrency(row.total_tax)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No GST transactions recorded in this cycle</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Inventory Valuation */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Stock Items</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{invData?.total_items || 0} SKUs</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inventory Cost Value</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(invData?.total_cost_value || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Retail Sales Potential</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(invData?.total_retail_value || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Projected Margin</p>
              <p className="text-xl font-black text-[var(--primary-color)] mt-1">{formatCurrency(invData?.potential_profit || 0)}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Inventory Stock Alerts</h3>
            <p className="text-xs text-slate-500 mb-4">Items requiring immediate reordering from suppliers</p>
            
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Min Threshold</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invData?.low_stock_items && invData.low_stock_items.length > 0 ? (
                    invData.low_stock_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-500">{item.stock_quantity}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{item.low_stock_alert}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                            LOW STOCK
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-emerald-600 font-medium">All inventory items are well-stocked!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
