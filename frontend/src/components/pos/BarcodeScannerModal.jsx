import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { 
  AlertCircle, Camera, Zap, ZapOff, RefreshCw, QrCode, 
  Barcode, CheckCircle2, ScanLine, ArrowRight 
} from 'lucide-react';
import Modal from '../common/Modal';

// Audio Beep Feedback using Web Audio API
const playSuccessBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz A5 beep
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

export const BarcodeScannerModal = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "High-Accuracy Barcode & QR Scanner", 
  subtitle = "Align product barcode or QR code within the target reticle" 
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [error, setError] = useState('');
  const [engineType, setEngineType] = useState('Detecting...');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [scanMode, setScanMode] = useState('all'); // 'all' | '1d' | 'qr'
  const [manualCode, setManualCode] = useState('');
  const [detectedFeedback, setDetectedFeedback] = useState(null);

  // Trigger success callback with audio/haptic feedback
  const handleScannedValue = useCallback((code, format = '') => {
    if (!code) return;
    playSuccessBeep();
    if (navigator.vibrate) {
      try { navigator.vibrate(80); } catch {}
    }
    setDetectedFeedback({ code, format });

    // Slight delay so user sees confirmation flash
    setTimeout(() => {
      onScanSuccess?.(code.trim());
      onClose();
    }, 280);
  }, [onScanSuccess, onClose]);

  // Load available camera devices
  useEffect(() => {
    if (!isOpen) return;
    navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !currentDeviceId) {
        // Prefer rear/environment camera
        const backCam = videoInputs.find((d) => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setCurrentDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
      }
    }).catch(() => {});
  }, [isOpen, currentDeviceId]);

  // Main scanning loop initialization
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setError('');
    setDetectedFeedback(null);

    const startScanner = async () => {
      try {
        // High-definition constraints for maximal barcode resolution
        const constraints = {
          video: {
            deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
            facingMode: currentDeviceId ? undefined : { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 60, min: 30 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const caps = track.getCapabilities();
          setTorchAvailable(!!caps.torch);
        }

        // 1. Try Native Hardware-Accelerated BarcodeDetector
        if ('BarcodeDetector' in window) {
          try {
            const allNativeFormats = [
              'qr_code', 'code_128', 'code_39', 'code_93', 
              'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'data_matrix'
            ];
            const detector = new window.BarcodeDetector({ formats: allNativeFormats });
            detectorRef.current = detector;
            setEngineType('Native Hardware GPU (60 FPS)');

            let scanningActive = true;
            const scanFrame = async () => {
              if (!scanningActive || isCancelled || !videoRef.current) return;
              if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const match = barcodes[0];
                    if (match.rawValue) {
                      scanningActive = false;
                      handleScannedValue(match.rawValue, match.format);
                      return;
                    }
                  }
                } catch (e) {
                  // Frame decode skip
                }
              }
              animationFrameRef.current = requestAnimationFrame(scanFrame);
            };

            animationFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          } catch (e) {
            console.warn('Native BarcodeDetector init failed, using ZXing fallback:', e);
          }
        }

        // 2. Fallback to ZXing with TRY_HARDER and multi-format hint configuration
        setEngineType('ZXing High-Precision Fallback');
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);

        // Configure formats based on scanMode
        let formats = [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
          BarcodeFormat.DATA_MATRIX
        ];

        if (scanMode === '1d') {
          formats = [
            BarcodeFormat.CODE_128,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_39,
            BarcodeFormat.ITF
          ];
        } else if (scanMode === 'qr') {
          formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];
        }

        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

        const codeReader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 80
        });
        zxingReaderRef.current = codeReader;

        codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (result && !isCancelled) {
            const text = result.getText();
            if (text) {
              codeReader.reset();
              handleScannedValue(text, result.getBarcodeFormat()?.toString());
            }
          }
        });

      } catch (err) {
        console.warn('Scanner camera error:', err);
        setError('Camera access denied or video device busy. Please ensure camera permissions are allowed.');
      }
    };

    startScanner();

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (zxingReaderRef.current) {
        try { zxingReaderRef.current.reset(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, currentDeviceId, scanMode, handleScannedValue]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const next = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: next }] });
        setTorchOn(next);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Switch camera device
  const cycleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIdx = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIdx = (currentIdx + 1) % videoDevices.length;
    setCurrentDeviceId(videoDevices[nextIdx].deviceId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedValue(manualCode.trim(), 'Manual');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Video Viewport Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center shadow-inner">
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />

          {/* Targeting Reticle & Laser Sweep Animation */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-full max-w-[280px] h-[200px] border-2 border-white/20 rounded-2xl">
              {/* Corner Reticle Brackets */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

              {/* Sweeping Laser Line Animation */}
              <div 
                className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" 
                style={{
                  top: '50%',
                  animation: 'scannerSweep 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          {/* Scan Feedback Flash */}
          {detectedFeedback && (
            <div className="absolute inset-0 bg-emerald-500/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in">
              <CheckCircle2 className="h-12 w-12 text-white animate-bounce" />
              <p className="font-extrabold text-sm mt-2">Code Scanned!</p>
              <p className="font-mono text-xs opacity-90 mt-0.5 px-3 py-1 bg-black/20 rounded-lg max-w-[80%] truncate">
                {detectedFeedback.code}
              </p>
            </div>
          )}

          {/* Top Controls Overlay: Engine Badge & Flashlight */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1.5">
              <ScanLine className="h-3 w-3 text-emerald-400 animate-pulse" />
              {engineType}
            </span>

            <div className="flex items-center gap-1.5">
              {torchAvailable && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md border transition ${
                    torchOn 
                      ? 'bg-amber-400 text-black border-amber-300' 
                      : 'bg-black/60 text-white border-white/10 hover:bg-black/80'
                  }`}
                  title="Toggle Flashlight / Torch"
                >
                  {torchOn ? <Zap className="h-4 w-4 fill-current" /> : <ZapOff className="h-4 w-4" />}
                </button>
              )}

              {videoDevices.length > 1 && (
                <button
                  type="button"
                  onClick={cycleCamera}
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition"
                  title="Switch Camera (Front/Rear)"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scan Mode Selector: All Formats / 1D Barcode / QR Code */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setScanMode('all')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              scanMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-[var(--primary-color,#4f46e5)] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>All Formats</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('1d')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              scanMode === '1d'
                ? 'bg-white dark:bg-slate-900 text-[var(--primary-color,#4f46e5)] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="h-3.5 w-3.5" />
            <span>1D Barcodes</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('qr')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              scanMode === 'qr'
                ? 'bg-white dark:bg-slate-900 text-[var(--primary-color,#4f46e5)] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Codes</span>
          </button>
        </div>

        {/* Manual Barcode Entry Fallback */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Manual Barcode / SKU Entry
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Type or paste barcode number..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#4f46e5)]"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3.5 py-2 rounded-xl bg-[var(--primary-color,#4f46e5)] text-white font-bold text-xs hover:opacity-95 disabled:opacity-40 transition flex items-center gap-1"
            >
              <span>Submit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
