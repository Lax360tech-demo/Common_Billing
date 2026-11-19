import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import Modal from './Modal';
import { formatCurrency } from '../../utils/formatters';

export const BarcodeTagModal = ({ isOpen, onClose, product, businessName }) => {
  if (!product) return null;
  const printAreaRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Barcode Tag" subtitle="Standard retail label with barcode and MRP" maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Printable Label Preview */}
        <div className="flex justify-center">
          <div
            ref={printAreaRef}
            className="w-72 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white p-4 text-center shadow-md text-slate-900"
          >
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">{businessName || 'Lax360 Store'}</p>
            <h4 className="mt-1 text-sm font-bold line-clamp-1">{product.name}</h4>
            <p className="text-[10px] text-slate-500 font-medium">SKU: {product.code || 'N/A'}</p>

            {/* Barcode graphic simulation */}
            <div className="my-3 flex flex-col items-center justify-center bg-slate-50 py-2 rounded-lg border border-slate-200">
              <div className="flex items-end justify-center h-12 gap-0.5">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1].map((w, idx) => (
                  <div key={idx} className="bg-black" style={{ width: `${w}px`, height: '100%' }} />
                ))}
              </div>
              <p className="mt-1 font-mono text-[11px] font-bold tracking-widest text-slate-700">{product.barcode || product.code}</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
              <span className="text-slate-500">Unit: <strong>{product.unit || 'pcs'}</strong></span>
              <span className="text-base font-extrabold text-slate-900">
                MRP: {formatCurrency(product.selling_price)}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Printer className="h-4 w-4" />
            Print Barcode Label
          </button>
        </div>
      </div>
    </Modal>
  );
};
