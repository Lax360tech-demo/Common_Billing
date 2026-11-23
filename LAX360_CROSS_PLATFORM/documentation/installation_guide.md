# LAX360 – Installation & Deployment Guide

This guide describes how to configure, run, test, and package both the FastAPI backend and the cross-platform React Native desktop/mobile frontend for the LAX360 software suite.

---

## 1. Prerequisites
- **Python**: Version 3.10 or higher (Python 3.13 tested and verified).
- **Node.js**: Version 18 or higher (Node.js v24 tested and verified).
- **Package Managers**: `pip` and `npm`.
- **Database**: MongoDB Atlas URI (or use the built-in fallback engine).

---

## 2. Backend Setup (FastAPI & MongoDB Atlas)

### Step 1: Navigate to the backend directory
```bash
cd backend
```

### Step 2: Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Inside `.env`, configure your MongoDB Atlas connection string:
```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=lax360_db
JWT_SECRET=lax360_super_secret_jwt_encryption_key_2026
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PORT=8000
HOST=0.0.0.0
```

### Step 4: Start the FastAPI Server
```bash
python main.py
```
Or with Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will automatically initialize the database collections, indexes, and seed all 40 authentic textile products and demo configuration on first launch.
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/api/health`

---

## 3. Frontend Setup (React Native & Cross-Platform Desktop/Mobile)

### Step 1: Navigate to the frontend directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Cross-Platform Application
- **Web & Desktop Browser Preview**:
  ```bash
  npm start
  ```
  Runs Metro bundler with React Native for Web support at `http://localhost:3000`.

- **Windows Desktop Application**:
  ```bash
  npm run desktop
  ```
  Launches the standalone desktop client.

- **Packaging Windows Installer (`.exe`)**:
  ```bash
  npm run dist
  ```
  Builds the standalone `LAX360-Setup.exe` installer for Windows.

- **Android Mobile Application**:
  ```bash
  npm run android
  ```

- **iOS Mobile Application (macOS only)**:
  ```bash
  npm run ios
  ```

---

## 4. Default Credentials
- **Email / Username**: `admin@gmail.com`
- **Password**: `admin`
- **Role**: Store Owner / Administrator
- **Sample Store**: Lady Avenue Showroom (T. Nagar, Salem, Tamil Nadu)
