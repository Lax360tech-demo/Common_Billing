const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Configure autoUpdater logger
autoUpdater.logger = console;
autoUpdater.autoDownload = false; // Give user choice or control via UI progress
autoUpdater.autoInstallOnAppQuit = true;

// Force native Win32 print dialog & disable stubbed Chromium preview on Windows
app.commandLine.appendSwitch('disable-print-preview');

let mainWindow = null;
let backendProcess = null;
let updateCheckTimer = null;

// Optional remote deployed web frontend for instant live updates (Track 1)
// Can be set via environment variable or default hosted URL
const REMOTE_FRONTEND_URL = process.env.LAX360_REMOTE_URL || '';

/**
 * Check if a local HTTP endpoint is responsive.
 */
function checkServer(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = http.get(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 80,
          path: '/api/health',
          timeout: 1500
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            resolve(res.statusCode === 200 && data.includes('LAX360'));
          });
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Launch the local Python FastAPI backend service if not already active.
 */
function startBackend() {
  const backendDir = path.join(__dirname, '..', '..', 'backend');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  try {
    backendProcess = spawn(pythonCmd, ['main.py'], {
      cwd: backendDir,
      stdio: 'ignore'
    });
  } catch (err) {
    console.warn('[LAX360 Desktop] Could not auto-launch python backend:', err);
  }
}

async function waitForServer(url, maxAttempts = 6) {
  for (let i = 0; i < maxAttempts; i++) {
    const isUp = await checkServer(url);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

/**
 * Broadcast an update event to the renderer process.
 */
function sendUpdateEvent(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:event', { status, ...data });
  }
}

/**
 * Wire up electron-updater events.
 */
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for available updates...');
    sendUpdateEvent('checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    sendUpdateEvent('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes || 'Bug fixes & performance improvements.'
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Application is up to date:', info?.version);
    sendUpdateEvent('not-available', {
      version: info?.version || app.getVersion()
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent || 0);
    const speed = Math.round((progressObj.bytesPerSecond || 0) / 1024); // KB/s
    console.log(`[AutoUpdater] Download progress: ${percent}% at ${speed} KB/s`);
    sendUpdateEvent('downloading', {
      percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded and ready to install:', info.version);
    sendUpdateEvent('downloaded', {
      version: info.version
    });
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Update error encountered:', err.message);
    sendUpdateEvent('error', {
      message: err.message || 'Error occurred while checking for updates.'
    });
  });
}

/**
 * Create the primary desktop window.
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: `LAX360 Billing – v${app.getVersion()}`,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Allows local camera, barcode scanner, receipt printing
    }
  });

  // Ensure fresh cache on remote loads so frontend updates reflect immediately
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType === 'mainFrame') {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Cache-Control': ['no-cache, no-store, must-revalidate']
        }
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  });

  // 1. Ensure backend is running
  let isBackendRunning = await checkServer('http://127.0.0.1:8000');
  if (!isBackendRunning) {
    startBackend();
    isBackendRunning = await waitForServer('http://127.0.0.1:8000', 8);
  }

  // 2. Dual-Track Frontend Loading Strategy
  if (!app.isPackaged) {
    // Development mode: check if Vite dev server is running on port 3000
    const isViteRunning = await checkServer('http://localhost:3000');
    if (isViteRunning) {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  } else if (REMOTE_FRONTEND_URL) {
    // Track 1: Live deployed frontend URL (with offline fallback)
    const isRemoteUp = await checkServer(REMOTE_FRONTEND_URL);
    if (isRemoteUp) {
      mainWindow.loadURL(REMOTE_FRONTEND_URL).catch(() => {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  } else {
    // Default local packaged bundle
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 3. Trigger initial auto-update check (Track 2)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.warn('[AutoUpdater] Initial check error:', err.message);
      });
    }, 4000);

    // Periodic background check every 30 minutes
    updateCheckTimer = setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 30 * 60 * 1000);
  }
}

// IPC Handlers
ipcMain.handle('updater:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('updater:check-for-updates', async () => {
  if (!app.isPackaged) {
    // In dev mode, return mock availability for local verification
    return { status: 'dev-mode', version: app.getVersion() };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', updateInfo: result?.updateInfo };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('updater:download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('updater:quit-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// Printer Discovery & Direct Bill Printing Handlers
ipcMain.handle('printer:get-printers', async () => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      return printers.map((p) => ({
        name: p.name,
        displayName: p.displayName || p.name,
        description: p.description || '',
        isDefault: !!p.isDefault,
        status: p.status
      }));
    }
    return [];
  } catch (err) {
    console.warn('[Printer] Failed to enumerate printers:', err.message);
    return [];
  }
});

ipcMain.handle('printer:print-bill', async (_event, { html, printerName, silent = false, paperSize = '80mm' }) => {
  return new Promise((resolve) => {
    let printWin = new BrowserWindow({
      show: false,
      title: 'LAX360 Print Engine',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const isA4 = paperSize === 'A4';
    const is58mm = paperSize === '58mm';

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWin.webContents.on('did-finish-load', () => {
      const printOptions = {
        silent: !!silent,
        printBackground: true,
        deviceName: printerName || ''
      };

      if (!isA4) {
        // Thermal roll sizing in microns (1mm = 1000 microns)
        printOptions.pageSize = {
          width: is58mm ? 58000 : 80000,
          height: 297000
        };
        printOptions.margins = {
          marginType: 'none'
        };
      } else {
        printOptions.pageSize = 'A4';
      }

      printWin.webContents.print(printOptions, (success, failureReason) => {
        try {
          if (printWin && !printWin.isDestroyed()) printWin.close();
        } catch (e) {}
        printWin = null;
        resolve({ success, failureReason: failureReason || null });
      });
    });

    printWin.webContents.on('did-fail-load', (_e, errorCode, errorDescription) => {
      try {
        if (printWin && !printWin.isDestroyed()) printWin.close();
      } catch (e) {}
      printWin = null;
      resolve({ success: false, failureReason: errorDescription });
    });
  });
});

ipcMain.handle('printer:open-preview', async (_event, { html, paperSize = '80mm' }) => {
  const isA4 = paperSize === 'A4';
  const is58mm = paperSize === '58mm';
  const width = isA4 ? 900 : is58mm ? 420 : 480;

  const previewWin = new BrowserWindow({
    width: width,
    height: 850,
    title: 'LAX360 – Bill Print Preview',
    autoHideMenuBar: true,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return { success: true };
});

// App Lifecycle
app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();
});

app.on('will-quit', () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
