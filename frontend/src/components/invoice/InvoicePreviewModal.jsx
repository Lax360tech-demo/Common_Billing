import React, { useState } from 'react';
import { Printer, Download, FileText, Smartphone, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { InvoiceA4Template } from './InvoiceA4Template';
import { Thermal80mmTemplate } from './Thermal80mmTemplate';
import { Thermal58mmTemplate } from './Thermal58mmTemplate';
import api from '../../api/client';

export const InvoicePreviewModal = ({ isOpen, onClose, invoice, settings }) => {
  const [activeFormat, setActiveFormat] = useState('80mm'); // 80mm | A4 | 58mm
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    const invoiceElement = document.getElementById('printable-invoice');
    if (!invoiceElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('The print pop-up was blocked. Please allow pop-ups for this site.');
      return;
    }

    const pageSize = activeFormat === 'A4' ? 'A4 portrait' : activeFormat === '58mm' ? '58mm auto' : '80mm auto';
    const pageMargin = activeFormat === 'A4' ? '10mm' : '2mm';

    const copiedStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.invoice_number}</title>
          ${copiedStyles}
          <style>
            @page { size: ${pageSize}; margin: ${pageMargin}; }
            body { margin: 0; padding: 0; background: white !important; color: black !important; }
            #printable-invoice { box-shadow: none !important; border: none !important; width: 100% !important; min-height: 0 !important; }
          </style>
        </head>
        <body>
          <div id="printable-invoice">${invoiceElement.innerHTML}</div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tax Invoice #${invoice.invoice_number}`} subtitle="Print receipt or download PDF" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {/* Format Selector Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFormat('80mm')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFormat === '80mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Thermal 80mm
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('58mm')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFormat === '58mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Thermal 58mm
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('A4')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFormat === 'A4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Full A4 Tax Invoice
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoice Preview Viewport */}
        <div className="max-h-[65vh] overflow-y-auto p-4 rounded-xl bg-slate-200/60 dark:bg-slate-950 flex justify-center">
          <div id="printable-invoice">
            {activeFormat === '80mm' && <Thermal80mmTemplate invoice={invoice} settings={settings} />}
            {activeFormat === '58mm' && <Thermal58mmTemplate invoice={invoice} settings={settings} />}
            {activeFormat === 'A4' && <InvoiceA4Template invoice={invoice} settings={settings} />}
          </div>
        </div>
      </div>
    </Modal>
  );
};
