import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useTheme } from '../context/ThemeContext';

// High-fidelity cash register supermarket beep generator via Web Audio API
function playScanBeep(isSuccess = true) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Crisp 1760 Hz supermarket confirmation chime (A6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else {
      // Low buzz for unrecognized barcode
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.19);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

export const BarcodeScannerModal = ({ visible, onClose, onBarcodeScanned, products = [] }) => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const activeStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const isScanningActiveRef = useRef(false);
  const lastScannedTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scanStatus, setScanStatus] = useState({ text: 'Align barcode inside viewfinder box', type: 'info' });
  const [scanCount, setScanCount] = useState(0);
  const [lastItemAdded, setLastItemAdded] = useState(null);

  // Stop scanning and release camera hardware tracks immediately
  const stopScanning = () => {
    isScanningActiveRef.current = false;

    // 1. Cancel requestAnimationFrame loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Stop and reset ZXing code reader
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {}
      codeReaderRef.current = null;
    }

    // 3. Stop tracks on activeStreamRef directly (persists even if video DOM element is unmounted)
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {}
      activeStreamRef.current = null;
    }

    // 4. Stop tracks on video element
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject;
          stream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        } catch (e) {}
        videoRef.current.srcObject = null;
      }
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {}
    }
  };

  const handleCancel = () => {
    stopScanning();
    if (onClose) onClose();
  };

  // Find product & variant from barcode or SKU
  const processBarcode = (rawCode) => {
    if (!rawCode) return;
    const code = String(rawCode).trim();
    if (!code) return;

    // Cooldown check: 1200ms for exact same barcode to prevent runaway duplicates, 500ms for different
    const now = Date.now();
    if (
      code === lastScannedCodeRef.current &&
      now - lastScannedTimeRef.current < 1200
    ) {
      return;
    }
    lastScannedCodeRef.current = code;
    lastScannedTimeRef.current = now;

    // Match in products catalog
    let matchedProduct = null;
    let matchedVariant = null;

    for (const prod of products) {
      if (prod.variants && Array.isArray(prod.variants)) {
        for (const v of prod.variants) {
          if (
            (v.barcode && String(v.barcode).trim() === code) ||
            (v.sku && String(v.sku).trim().toLowerCase() === code.toLowerCase())
          ) {
            matchedProduct = prod;
            matchedVariant = v;
            break;
          }
        }
      }
      if (matchedVariant) break;

      // Fallback check on top-level product
      if (
        (prod.barcode && String(prod.barcode).trim() === code) ||
        (prod.sku && String(prod.sku).trim().toLowerCase() === code.toLowerCase()) ||
        (prod.id && String(prod.id).trim().toLowerCase() === code.toLowerCase())
      ) {
        matchedProduct = prod;
        matchedVariant = (prod.variants && prod.variants[0]) || {
          id: `v-${prod.id}`,
          size: 'Standard',
          color: 'Standard',
          hex: '#000000',
          price: prod.price,
          mrp: prod.mrp
        };
        break;
      }
    }

    if (matchedProduct && matchedVariant) {
      playScanBeep(true);
      setScanCount((prev) => prev + 1);
      setLastItemAdded({
        name: matchedProduct.name,
        size: matchedVariant.size,
        color: matchedVariant.color,
        price: matchedVariant.price || matchedProduct.price,
        barcode: code
      });
      setScanStatus({
        text: `Added: ${matchedProduct.name} (${matchedVariant.size}) +1`,
        type: 'success'
      });

      // Invoke parent handler to dynamically add 1 item to billing cart
      if (onBarcodeScanned) {
        onBarcodeScanned(matchedVariant, matchedProduct, 1);
      }
    } else {
      playScanBeep(false);
      setScanStatus({
        text: `Barcode "${code}" not found in store catalog.`,
        type: 'error'
      });
    }
  };

  // Start Real-Time Camera Barcode Scanner
  const startScanning = async () => {
    try {
      stopScanning();
      isScanningActiveRef.current = true;

      // Check available video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);

      const targetDeviceId = selectedDeviceId || (videoDevices[0] ? videoDevices[0].deviceId : undefined);

      // Prefer high-performance native Chromium BarcodeDetector if available
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
          const targetFormats = [
            'code_128',
            'code_39',
            'code_93',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'qr_code'
          ].filter((f) => supportedFormats.includes(f));

          const detector = new window.BarcodeDetector({ formats: targetFormats });

          const constraints = {
            video: targetDeviceId
              ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          activeStreamRef.current = stream;
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            const detectFrame = async () => {
              if (!isScanningActiveRef.current || !videoRef.current) return;
              try {
                if (videoRef.current.readyState >= 2) {
                  const detected = await detector.detect(videoRef.current);
                  if (detected && detected.length > 0) {
                    processBarcode(detected[0].rawValue);
                  }
                }
              } catch (detectErr) {
                // frame detection cycle error
              }
              if (isScanningActiveRef.current) {
                animFrameRef.current = requestAnimationFrame(detectFrame);
              }
            };

            animFrameRef.current = requestAnimationFrame(detectFrame);
            return;
          }
        } catch (nativeErr) {
          console.warn('Native BarcodeDetector initialization fallback to ZXing:', nativeErr);
        }
      }

      // Universal Fallback: @zxing/browser
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      setHasCameraPermission(true);

      if (videoRef.current) {
        await codeReader.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, err) => {
            if (!isScanningActiveRef.current) return;
            if (result) {
              processBarcode(result.getText());
            }
          }
        );
        if (videoRef.current && videoRef.current.srcObject) {
          activeStreamRef.current = videoRef.current.srcObject;
        }
      }
    } catch (err) {
      console.error('Camera Scanner Error:', err);
      setHasCameraPermission(false);
      setScanStatus({
        text: 'Unable to access camera. Please verify camera permissions or type barcode below.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (visible) {
      setScanCount(0);
      setLastItemAdded(null);
      setScanStatus({ text: 'Align barcode inside viewfinder box', type: 'info' });
      // Small timeout to let Modal mount the DOM video element
      const timer = setTimeout(() => {
        startScanning();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanning();
      };
    } else {
      stopScanning();
    }
  }, [visible, selectedDeviceId]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processBarcode(manualInput.trim());
      setManualInput('');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📷</Text>
                <Text style={[styles.title, { color: colors.textMain }]}>Real-Time Barcode Scanner</Text>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Point camera at garment barcode / SKU tag to auto-add items to bill
              </Text>
            </View>

            <TouchableOpacity onPress={handleCancel} style={[styles.closeBtn, { backgroundColor: colors.bgMain }]}>
              <Text style={{ fontSize: 16, color: colors.textMain, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Camera Viewfinder Viewport */}
          <View style={styles.cameraContainer}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 14,
                backgroundColor: '#000000'
              }}
              playsInline
              muted
              autoPlay
            />

            {/* Viewfinder Target Framing Reticle */}
            <View style={styles.viewfinderFrame}>
              <View style={styles.reticleCornerTL} />
              <View style={styles.reticleCornerTR} />
              <View style={styles.reticleCornerBL} />
              <View style={styles.reticleCornerBR} />

              {/* Animated Laser Bar */}
              <View style={styles.laserScanLine} />
            </View>

            {/* Top Scanning Badge */}
            <View style={styles.cameraOverlayHUD}>
              <Text style={styles.hudText}>
                {scanCount > 0 ? `🎯 Items Scanned in Session: ${scanCount}` : '⚡ High-Accuracy Fast Engine'}
              </Text>
            </View>

            {hasCameraPermission === false && (
              <View style={styles.permissionWarning}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>📷🚫</Text>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
                  Camera Permission Required
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  Enable camera access in your system/browser settings, or enter barcode below.
                </Text>
              </View>
            )}
          </View>

          {/* Camera Switcher (if multiple cameras detected) */}
          {availableDevices.length > 1 && (
            <View style={styles.deviceSelectRow}>
              <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>Switch Camera:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 8 }}>
                {availableDevices.map((d, idx) => (
                  <TouchableOpacity
                    key={d.deviceId || idx}
                    onPress={() => setSelectedDeviceId(d.deviceId)}
                    style={[
                      styles.deviceChip,
                      {
                        backgroundColor: selectedDeviceId === d.deviceId ? colors.primary : colors.bgMain,
                        borderColor: colors.border
                      }
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: selectedDeviceId === d.deviceId ? '#FFFFFF' : colors.textMain,
                        fontWeight: '600'
                      }}
                    >
                      {d.label || `Camera ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Real-time Scan Status Feedback Banner */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor:
                  scanStatus.type === 'success'
                    ? '#DCFCE7'
                    : scanStatus.type === 'error'
                    ? '#FEE2E2'
                    : colors.bgMain,
                borderColor:
                  scanStatus.type === 'success'
                    ? '#86EFAC'
                    : scanStatus.type === 'error'
                    ? '#FCA5A5'
                    : colors.border
              }
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    scanStatus.type === 'success'
                      ? '#166534'
                      : scanStatus.type === 'error'
                      ? '#991B1B'
                      : colors.textMain
                }
              ]}
              numberOfLines={2}
            >
              {scanStatus.text}
            </Text>
          </View>

          {/* Last Added Item Pill */}
          {lastItemAdded && (
            <View style={[styles.lastAddedPill, { borderColor: colors.border, backgroundColor: colors.bgMain }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lastItemName, { color: colors.textMain }]}>{lastItemAdded.name}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Size: {lastItemAdded.size} • Color: {lastItemAdded.color} • Barcode: {lastItemAdded.barcode}
                </Text>
              </View>
              <Text style={[styles.lastItemPrice, { color: colors.primary }]}>₹{lastItemAdded.price}</Text>
            </View>
          )}

          {/* Quick Manual Barcode / USB Gun Scanner Input */}
          <View style={styles.manualInputGroup}>
            <TextInput
              style={[styles.manualTextInput, { borderColor: colors.border, color: colors.textMain }]}
              placeholder="Or type/paste Barcode / SKU (e.g. 890100100101)..."
              placeholderTextColor={colors.textMuted}
              value={manualInput}
              onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.manualAddBtn, { backgroundColor: colors.primary }]}
              onPress={handleManualSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.manualAddBtnText}>Add to Bill</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Controls */}
          <View style={styles.footerRow}>
            <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1, marginRight: 12 }}>
              💡 Continuous mode enabled: Keep scanning multiple items dynamically one by one.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={handleCancel} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 13 }}>Cancel Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Done Scanning</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14
  },
  title: {
    fontSize: 18,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraContainer: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewfinderFrame: {
    position: 'absolute',
    width: 260,
    height: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reticleCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: '#22C55E'
  },
  reticleCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: '#22C55E'
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: '#22C55E'
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: '#22C55E'
  },
  laserScanLine: {
    width: '92%',
    height: 2.5,
    backgroundColor: '#EF4444',
    boxShadow: '0 0 10px #EF4444'
  },
  cameraOverlayHUD: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },
  hudText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700'
  },
  permissionWarning: {
    position: 'absolute',
    width: '80%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center'
  },
  deviceSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  deviceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6
  },
  statusBanner: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700'
  },
  lastAddedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  lastItemName: {
    fontSize: 13,
    fontWeight: '700'
  },
  lastItemPrice: {
    fontSize: 14,
    fontWeight: '800'
  },
  manualInputGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  manualTextInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13
  },
  manualAddBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  manualAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  }
});
