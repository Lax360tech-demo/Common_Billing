import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Banknote, QrCode, CreditCard, Building, Split, ArrowRight, 
  Copy, CheckCircle2, ScanBarcode, Camera, RefreshCw, ShieldCheck, ExternalLink
} from 'lucide-react';
import Modal from '../common/Modal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export const PaymentModal = ({ isOpen, onClose }) => {
  const { cartTotals, completeCheckout } = useCart();
  const { business } = useAuth();
  const { showToast } = useApp();

  const [method, setMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState(cartTotals.grandTotal);
  const [splitCash, setSplitCash] = useState(Math.round(cartTotals.grandTotal / 2));
  const [splitUPI, setSplitUPI] = useState(cartTotals.grandTotal - Math.round(cartTotals.grandTotal / 2));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // High-Accuracy QR Code & Real-Time Scanner State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [upiPayload, setUpiPayload] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate change due for cash payments
  const changeDue = Math.max(0, (Number(cashTendered) || 0) - cartTotals.grandTotal);

  // Generate High-Accuracy Dynamic UPI QR Code whenever amount, method or split changes
  useEffect(() => {
    if (!isOpen) return;

    const upiAmount = method === 'Split' ? Number(splitUPI) : Number(cartTotals.grandTotal);
    if (upiAmount <= 0) {
      setQrCodeDataUrl('');
      return;
    }

    // Standardized Indian NPCI UPI Deep Link specification
    const vpa = business?.upi_id || `${(business?.phone || 'merchant').replace(/[^0-9a-zA-Z]/g, '')}@upi`;
    const merchantName = encodeURIComponent(business?.name || 'Lax360 Enterprise Store');
    const billRef = `LAX${Date.now().toString().slice(-6)}`;
    const upiLink = `upi://pay?pa=${vpa}&pn=${merchantName}&am=${upiAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + billRef)}`;

    setUpiPayload(upiLink);

    // High Error Correction Level 'H' (30% recovery) for max scanning accuracy
    QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      scale: 8,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
      });
  }, [isOpen, cartTotals.grandTotal, method, splitUPI, business]);

  const handleCopyUpi = () => {
    if (!upiPayload) return;
    navigator.clipboard.writeText(upiPayload);
    setCopied(true);
    showToast('UPI payment link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanSuccess = (scannedCode) => {
    setReference(scannedCode);
    showToast(`Scanned payment reference: ${scannedCode}`, 'success');
    setIsScannerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const combinedNotes = [
        notes.trim(),
        reference.trim() ? `UTR/Ref: ${reference.trim()}` : ''
      ].filter(Boolean).join(' | ');

      const paymentData = {
        payment_method: method,
        paid_amount: method === 'Cash' ? Math.min(Number(cashTendered), cartTotals.grandTotal) : cartTotals.grandTotal,
        notes: combinedNotes,
        split_details: method === 'Split' ? { Cash: Number(splitCash), UPI: Number(splitUPI) } : {}
      };

      await completeCheckout(paymentData);
      onClose();
    } catch {
      // toast handled in CartContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodsList = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
    { id: 'Card', label: 'Card (POS)', icon: CreditCard },
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building },
    { id: 'Split', label: 'Split', icon: Split }
  ];

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Payment & Invoice Finalization (F8)" 
        subtitle={`Total Payable: ${formatCurrency(cartTotals.grandTotal)}`} 
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {methodsList.map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Content Area */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            {/* CASH PAYMENT VIEW */}
            {method === 'Cash' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cash Received</label>
                  <input
                    type="number"
                    step="any"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-36 text-right px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-sm focus:outline-indigo-600"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  {[cartTotals.grandTotal, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 font-semibold">Change Return:</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {/* HIGH-ACCURACY DYNAMIC UPI QR & REAL-TIME SCANNING VIEW */}
            {(method === 'UPI' || method === 'Split') && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Dynamic High-Accuracy QR Code Container */}
                  <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    {qrCodeDataUrl ? (
                      <div className="relative flex flex-col items-center">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Dynamic UPI QR Code" 
                          className="w-44 h-44 object-contain rounded-lg"
                        />
                        {/* Center UPI Verified Hologram Badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1.5 py-0.5 rounded-md shadow-xs border border-slate-200 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-[9px] font-black tracking-wider text-slate-800 uppercase">UPI</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        <RefreshCw className="h-6 w-6 animate-spin mb-1" />
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Payment Amount & VPA Subtext */}
                  <div className="mt-2.5 space-y-0.5">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      Scan & Pay {formatCurrency(method === 'Split' ? splitUPI : cartTotals.grandTotal)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 font-medium">
                      VPA: {business?.upi_id || `${(business?.phone || 'merchant').replace(/[^0-9a-zA-Z]/g, '')}@upi`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Google Pay • PhonePe • Paytm • BHIM • Cred • Banking Apps
                    </p>
                  </div>

                  {/* Actions: Real-Time Camera Scan & Copy UPI Link */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Real-Time Camera Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Split Payment Controls if Split selected */}
                {method === 'Split' && (
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Cash Portion:</span>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setSplitCash(val);
                          setSplitUPI(Math.max(0, cartTotals.grandTotal - val));
                        }}
                        className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">UPI / QR Portion:</span>
                      <input
                        type="number"
                        value={splitUPI}
                        onChange={(e) => setSplitUPI(Number(e.target.value) || 0)}
                        className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CARD & BANK TRANSFER VIEW */}
            {['Card', 'Bank Transfer'].includes(method) && (
              <div className="text-center py-3 text-xs text-slate-500">
                Process swipe/chip on your EDC POS card terminal or collect bank NEFT/IMPS and record reference below.
              </div>
            )}
          </div>

          {/* Real-Time Transaction Reference / UTR Input with Inline Scanner */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Transaction / UTR Reference #
              </label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <ScanBarcode className="h-3.5 w-3.5" />
                <span>Scan Receipt / Voucher</span>
              </button>
            </div>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="e.g. 401928374619 or scan from customer phone..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold focus:outline-indigo-600"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer"
                title="Scan Customer Transaction QR / Barcode"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Remarks Field */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="Special delivery notes or customer remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
          </div>

          {/* Action Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
            >
              <span>{isSubmitting ? 'Finalizing Invoice...' : 'Generate Tax Invoice'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Real-Time Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Customer Payment QR / UTR Voucher"
        subtitle="Align customer's payment screen or receipt barcode in the camera reticle"
      />
    </>
  );
};

export default PaymentModal;
