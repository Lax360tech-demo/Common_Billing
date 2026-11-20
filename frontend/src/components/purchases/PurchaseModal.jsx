import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ScanBarcode } from 'lucide-react';
import Modal from '../common/Modal';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export const PurchaseModal = ({ isOpen, onClose, onSaved }) => {
  const { showToast } = useApp();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers?limit=100'),
        api.get('/products?limit=200')
      ]);
      setSuppliers(supRes.data.items || []);
      setProducts(prodRes.data.items || []);
      if (supRes.data.items?.length > 0) {
        setSupplierId(supRes.data.items[0].id);
      }
      setItems([{ product_id: '', name: '', quantity: 1, unit_cost: 0, tax_rate: 18, unit: 'pcs' }]);
    } catch (err) {
      console.warn('Purchase deps load error:', err);
    }
  };

  const handleProductSelect = (index, prodId) => {
    const selected = products.find((p) => p.id === prodId);
    if (!selected) return;
    const next = [...items];
    next[index] = {
      product_id: selected.id,
      name: selected.name,
      quantity: next[index].quantity || 1,
      unit_cost: selected.purchase_price || 0,
      tax_rate: selected.tax_rate || 18,
      unit: selected.unit || 'pcs'
    };
    setItems(next);
  };

  const updateItem = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  const addItemRow = () => {
    setItems([...items, { product_id: '', name: '', quantity: 1, unit_cost: 0, tax_rate: 18, unit: 'pcs' }]);
  };

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleBarcodeScanned = (code) => {
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === code.toLowerCase())
    );
    if (found) {
      const existingIdx = items.findIndex((it) => it.product_id === found.id);
      if (existingIdx > -1) {
        const next = [...items];
        next[existingIdx].quantity = (Number(next[existingIdx].quantity) || 1) + 1;
        setItems(next);
      } else {
        const cleanItems = items.filter((it) => it.product_id);
        setItems([
          ...cleanItems,
          {
            product_id: found.id,
            name: found.name,
            quantity: 1,
            unit_cost: found.purchase_price || 0,
            tax_rate: found.tax_rate || 18,
            unit: found.unit || 'pcs'
          }
        ]);
      }
      showToast(`Scanned and added: ${found.name}`, 'success');
    } else {
      showToast(`Product with barcode "${code}" not found in inventory`, 'warning');
    }
  };

  const calculatedTotal = items.reduce((acc, it) => {
    const lineGross = (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0);
    const lineTax = lineGross * ((Number(it.tax_rate) || 0) / 100);
    return acc + lineGross + lineTax;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (items.length === 0 || !items[0].product_id) {
      showToast('Please add at least one product line item', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: supplierId,
        supplier_invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        items,
        paid_amount: parseFloat(paidAmount) || 0,
        payment_method: paymentMethod
      };
      await api.post('/purchases', payload);
      showToast('Purchase Bill recorded & Inventory restocked successfully!', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to record purchase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="New Purchase Order & Inward Stock" subtitle="Replenishes inventory automatically upon recording" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supplier *</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supplier Bill / Invoice #</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              placeholder="e.g. INV-9901"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Inward Product Items</h5>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Scan barcode on incoming vendor packages"
              >
                <ScanBarcode className="h-3.5 w-3.5" />
                <span>Scan Barcode</span>
              </button>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 items-center">
                <div className="col-span-5">
                  <select
                    value={it.product_id}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Cost (₹)"
                    value={it.unit_cost}
                    onChange={(e) => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div className="col-span-2 text-right font-bold text-xs">
                  {formatCurrency((it.quantity * it.unit_cost) * (1 + (it.tax_rate || 0)/100))}
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => removeItemRow(idx)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500 block">Total Bill:</span>
              <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-400">{formatCurrency(calculatedTotal)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Paid Amount:</span>
              <input
                type="number"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block">Method:</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md">
              {isSubmitting ? 'Recording...' : 'Record Purchase & Restock'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
    <BarcodeScannerModal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      onScanSuccess={handleBarcodeScanned}
      title="Scan Inward Product Barcode"
      subtitle="Point camera at package or product barcode to add to purchase bill"
    />
    </>
  );
};
