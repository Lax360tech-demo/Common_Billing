# LAX360 Billing – Automatic Updates & Release Management Guide

This guide details the complete, production-ready automatic update system implemented for **LAX360 Billing**.

---

## 1. Dual-Track Update Architecture Overview

LAX360 Billing uses a **Dual-Track Update Architecture** designed to minimize re-installations while ensuring desktop reliability:

```
                            LAX360 Billing Application
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
        Track 1: Live Web Updates                      Track 2: Binary Auto-Updates
   (React Components, Styles, Templates)              (Electron Main, Native Code)
                 │                                             │
      Instant delivery via hosting                     `electron-updater` background check
       (Vercel, Netlify, or Server)                    against GitHub Releases `latest.yml`
                 │                                             │
      Loads immediately on app open                   Downloads update in background
       (Zero installation required)                   Notifies user → Restarts & installs
```

---

## 2. Track 1: Live Frontend Web Updates (Instant Delivery)

### When to Use:
- Modifying React screens (POS, Invoices, Dashboard, Products, Customers, Settings).
- Changing UI color themes, button layouts, receipt templates, barcodes, or styles.
- Adding client-side validation, discount calculations, or print formatting.

### How It Works:
1. When you deploy your React frontend to your hosted URL (e.g. `https://common-billing.vercel.app` or your custom domain), you can set `LAX360_REMOTE_URL` in the environment or build.
2. The Electron main process checks if the hosted web application is reachable with an instant ping:
   - **Online**: Loads the live, secure web frontend with `Cache-Control: no-cache` on `index.html`. Users immediately get the latest changes upon opening or refreshing the app.
   - **Offline / Disconnected**: Instantly falls back to local packaged `dist/index.html`. All local billing, offline database queries, and printing continue to work with zero interruption.

---

## 3. Track 2: Native Binary Auto-Updates (`electron-updater`)

### When to Use:
- Modifying Electron main process files (`electron/main.js`, `electron/preload.js`).
- Adding or upgrading Node.js native dependencies.
- Updating window configurations, system tray, hardware printer bridges, or Electron versions.

### How It Works:
1. When the desktop app launches, it automatically checks GitHub Releases after 4 seconds.
2. It continues to run a periodic background check **every 30 minutes** while the application is active.
3. If a newer SemVer release is found on GitHub Releases (e.g., currently installed `v1.0.0` vs published `v1.0.1`):
   - Emits an `available` event across the secure context-isolated preload bridge.
   - The React UI displays a floating, themed **"New Update Available"** banner.
   - If the user clicks **"Download Update"** (or auto-download), it downloads the NSIS installer in the background while the cashier continues billing.
   - Real-time download progress (percentage, transfer speed in KB/s) is displayed.
   - Once downloaded, it prompts: **"Update Ready to Install"**.
   - Clicking **"Restart & Update"** calls `autoUpdater.quitAndInstall()`, silently upgrading the application and relaunching it in seconds.

---

## 4. How 7za Packaging Error (`3221226505`) Was Resolved

### Root Cause:
`3221226505` (`0xC0000409` - STATUS_STACK_BUFFER_OVERRUN) occurred when 7za.exe attempted multi-threaded LZMA differential blockmap compression on Windows x64 when handling uncompressed bundles over 300MB.

### Fix Applied in `package.json`:
```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "LAX360 Billing",
  "differentialPackage": false,
  "deleteAppDataOnUninstall": false
}
```
- Setting `"differentialPackage": false` bypasses the buggy 7za differential pass, allowing 7-Zip to package the NSIS installer smoothly with exit code 0.
- Setting `"deleteAppDataOnUninstall": false` guarantees that user data, authentication tokens, and local showroom databases are never erased during updates.

---

## 5. Step-by-Step Release Workflow (Developer Guide)

### Releasing an Update:

#### Step 1: Increment the Version in `package.json`
Edit `LAX360_CROSS_PLATFORM/frontend/package.json`:
```json
{
  "name": "lax360-frontend",
  "version": "1.0.1"
}
```

#### Step 2: Push a Tag to Trigger Automated GitHub Actions
```bash
git add .
git commit -m "Release v1.0.1: Added auto-updater and invoice download"
git tag v1.0.1
git push origin main --tags
```

#### Step 3: Automated CI/CD Execution
The GitHub Actions workflow (`.github/workflows/release.yml`) automatically:
1. Checks out the code.
2. Installs dependencies (`npm install`).
3. Compiles the production React bundle (`npm run build`).
4. Runs `electron-builder --win --publish always`.
5. Uploads:
   - `LAX360 Billing Setup 1.0.1.exe`
   - `latest.yml` (update metadata with SHA-512 hash)
   - `LAX360 Billing Setup 1.0.1.exe.blockmap`
   directly to GitHub Releases under tag `v1.0.1`.

#### Step 4 (Alternative): Manual Build & Local Publish
If you want to build and publish locally from your terminal using a Personal Access Token:
```powershell
$env:GH_TOKEN="your_github_token_here"
npm run electron:publish
```
Or to build local test installers without publishing to GitHub:
```powershell
npm run electron:build
```
Generated installers and `latest.yml` are saved in `frontend/release/`.

---

## 6. One-Time Migration for Existing v1.0.0 Users

Because the original `v1.0.0` installer did not have `electron-updater` wired in `electron/main.js`:
- Users who installed the original `v1.0.0` build must install `v1.0.1` **one time** by running `LAX360 Billing Setup 1.0.1.exe`.
- It installs directly over the existing installation without uninstalling or losing data.
- **Starting from v1.0.1, all future updates (v1.0.2, v1.1.0, v2.0.0, etc.) will be delivered 100% automatically in the background without manual downloads.**

---

## 7. Security & Architecture Checklist

| Security & Architecture Standard | Status | Implementation Detail |
| :--- | :---: | :--- |
| **Context Isolation** | Enabled | `contextIsolation: true` in `BrowserWindow` webPreferences |
| **Node Integration** | Disabled | `nodeIntegration: false` prevents malicious script execution |
| **Preload Bridge** | Active | `electron/preload.js` exposes only explicit `electronUpdater` methods |
| **Data Preservation** | Verified | Customer data, invoices, SQLite/MongoDB files kept outside installer dir |
| **Offline Fallback** | Verified | If remote URL or GitHub is unreachable, local bundled `dist/index.html` runs |
| **Token Safety** | Verified | No GitHub tokens or private keys stored in client source code |
