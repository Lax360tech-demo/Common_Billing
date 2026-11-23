const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure context bridge for Electron auto-updater.
 * Exposes strictly validated, restricted methods to the React frontend.
 */
contextBridge.exposeInMainWorld('electronUpdater', {
  /**
   * Get the current running application version.
   * @returns {Promise<string>}
   */
  getAppVersion: () => ipcRenderer.invoke('updater:get-version'),

  /**
   * Manually trigger an update check.
   */
  checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),

  /**
   * Start downloading an available update.
   */
  downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),

  /**
   * Quit the application and install the downloaded update.
   */
  quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),

  /**
   * Subscribe to updater events:
   * status values: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
   * @param {Function} callback - (eventData) => void
   */
  onUpdateEvent: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('updater:event', handler);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('updater:event', handler);
  }
});

/**
 * Secure context bridge for Native Printing and Printer Discovery.
 */
contextBridge.exposeInMainWorld('electronPrinter', {
  /**
   * Get all connected Windows printers.
   * @returns {Promise<Array<{name: string, displayName: string, isDefault: boolean}>>}
   */
  getPrinters: () => ipcRenderer.invoke('printer:get-printers'),

  /**
   * Print bill HTML directly with custom printer, paper size, and silent options.
   * @param {Object} options - { html, printerName, silent, paperSize }
   */
  printBill: (options) => ipcRenderer.invoke('printer:print-bill', options),

  /**
   * Open dedicated standalone print preview window.
   * @param {Object} options - { html, paperSize }
   */
  openPreviewWindow: (options) => ipcRenderer.invoke('printer:open-preview', options)
});

