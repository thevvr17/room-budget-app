# 🏠 Room Budget & Expense Management App

A modern full-stack web application designed for shared apartments and flatmates to track monthly budgets, log daily expenses, calculate prorated member shares, settle debts, and receive real-time notifications via WebSockets.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Local Development Setup](#-local-development-setup)
- [MongoDB Atlas (Cloud Database) Guide](#-mongodb-atlas-cloud-database-guide)
- [Production Deployment Guide](#-production-deployment-guide)
- [Deployment Readiness Checklist](#-deployment-readiness-checklist)
- [API Endpoints Overview](#-api-endpoints-overview)
- [WebSocket Events](#-websocket-events)

---

## 🏗️ Architecture & Tech Stack

```
[ React 19 + Vite Frontend ] ──(HTTP / REST API)───┐
             │                                     ▼
             │                              [ Node.js + Express 5 ]
             └──(WebSockets via Socket.IO)──▶ [ Socket.IO Server   ]
                                                   │
                                                   ▼
                                        [ MongoDB Atlas Cluster ]
```

- **Frontend:**
  - **React 19** with **Vite 8**
  - **Tailwind CSS 4** for styling
  - **React Router DOM 7** for client-side routing
  - **Axios** with global 401 interceptors
  - **Socket.IO Client** for real-time live synchronization
  - **Recharts** for visual budget & expense analytics
  - **React Hot Toast** for notifications

- **Backend:**
  - **Node.js** with **Express 5**
  - **Mongoose 9** for MongoDB object modeling
  - **Socket.IO 4** for live push events
  - **JWT (JSON Web Tokens)** & **bcryptjs** for authentication & password security
  - Built-in HTTP request logging and health checks (`/health`, `/api/health`)

- **Database:**
  - **MongoDB Atlas** (Cloud-hosted multi-tenant cluster)

---

## ✨ Key Features

1. **Room Management & Member Lifecycles:**
   - Create rooms with custom monthly contribution targets per person.
   - Join requests & approval workflow.
   - Prorated budget charges based on exact join/leave dates within the billing month.
2. **Expense Tracking & Auto-Categorization:**
   - Add, edit, and delete shared expenses.
   - Smart keyword category detection (food, rent, utilities, internet, etc.).
   - Expense settlement status tracking.
3. **Settlements & Top-ups:**
   - Automatic calculation of who owes whom.
   - Settle individual expenses or aggregate balances.
   - Track room budget top-ups.
4. **Real-time Live Sync (Socket.IO):**
   - Instant UI updates when expenses are added, edited, or settled.
   - Real-time room activity alerts.
5. **Role-Based Access Control:**
   - Member vs. Admin permissions.
   - Protected routes and token authentication.

---

## 📂 Project Directory Structure

```text
room-budget-app/
├── backend/
│   ├── controllers/            # Route controllers (admin, budget, expenses, room, etc.)
│   ├── middleware/             # Auth & Room permission middlewares
│   ├── models/                 # Mongoose schemas (User, Room, Expense, Settlement, etc.)
│   ├── routes/                 # Express API routes
│   ├── services/               # Core business logic (budget proration service)
│   ├── utils/                  # Helper utilities (category detection)
│   ├── .env                    # Local environment variables (do NOT commit)
│   ├── .env.example            # Backend env template
│   ├── package.json            # Backend dependencies and scripts
│   └── server.js               # Express application & Socket.IO server entry
├── frontend/
│   ├── src/
│   │   ├── assets/             # Static graphics and images
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application views (Dashboard, Expenses, Members, etc.)
│   │   ├── services/           # Axios instance (`api.js`) & Socket connection (`socket.js`)
│   │   ├── App.jsx             # Route definitions
│   │   └── main.jsx            # React root mount
│   ├── .env.example            # Frontend env template
│   ├── index.html              # HTML shell
│   ├── package.json            # Frontend dependencies and scripts
│   └── vite.config.js          # Vite config & dev proxy
├── .gitignore                  # Global repository gitignore
└── README.md                   # Project documentation & deployment guide
```

---

## ⚙️ Prerequisites

- **Node.js**: v18.0.0 or later (Node 20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB Atlas Account**: Free tier (M0) or dedicated cluster

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Port for the Express server (defaults to 5000) | `5000` |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/room_budget?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Secret string used to sign and verify JWT tokens | `super_secure_random_key_here` |
| `BASE_URL` | **Yes (Prod)**| Allowed origin for CORS & Socket.IO | `http://localhost:5173` (Dev) / `https://your-frontend.vercel.app` (Prod) |
| `ADMIN_SECRET_CODE`| Optional | Secret code to claim admin role during registration | `FIRSTPROJECT` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Optional | Full URL to the backend `/api` endpoint | `http://localhost:5000/api` (Dev) / `https://your-backend.onrender.com/api` (Prod) |
| `VITE_SOCKET_URL` | Optional | Full URL to the backend Socket.IO server | `http://localhost:5000` (Dev) / `https://your-backend.onrender.com` (Prod) |
| `VITE_BASE_URL` | Optional | Base URL fallback for both API and Socket | `https://your-backend.onrender.com` |

> *Note: In local development, the frontend Vite dev server automatically proxies `/api` requests to `http://localhost:5000` if environment variables are left blank.*

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd room-budget-app
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT Secret
npm run dev
# Server will start on http://localhost:5000
```

### 3. Configure Frontend
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend will be live on http://localhost:5173
```

---

## 🍃 MongoDB Atlas (Cloud Database) Guide

### How to access it and will it run 24/7?

1. **Does it run 24/7?**
   - **YES.** MongoDB Atlas is a fully managed cloud database hosted on AWS/Google Cloud/Azure infrastructure.
   - It runs continuously in the cloud **24 hours a day, 7 days a week**, completely independent of your local machine. You can turn off your laptop, and the database remains live.
   - Free tier (M0) clusters do NOT sleep or disconnect during regular use.

2. **Crucial Step: Network IP Whitelist (`0.0.0.0/0`)**
   - By default, MongoDB Atlas blocks connections from unfamiliar IPs.
   - In development, your home IP was likely whitelisted.
   - **For deployment**: Cloud platforms (like Render, Vercel, Railway, AWS) use dynamic IP pools that change on every deploy or request.
   - **Action Required:**
     1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
     2. In the left menu under **Security**, click **Network Access**.
     3. Click **+ Add IP Address**.
     4. Click **Allow Access From Anywhere** (this enters `0.0.0.0/0`).
     5. Click **Confirm**.

3. **Database User Credentials:**
   - In Atlas, navigate to **Database Access**.
   - Create a user (e.g. `budget_admin`) with `Read and write to any database` permissions.
   - If your password contains special characters (`@`, `#`, `%`, etc.), ensure they are properly URL-encoded.

4. **Connecting via GUI (MongoDB Compass):**
   - Download and open [MongoDB Compass](https://www.mongodb.com/products/tools/compass).
   - Paste your `MONGO_URI` connection string and click **Connect** to inspect collections, modify records, or view indexes visually.

---

## 🌐 Production Deployment Guide

The recommended deployment architecture is:
- **Backend**: Hosted on [Render](https://render.com/) or [Railway](https://railway.app/) (Node.js web service with WebSocket support).
- **Frontend**: Hosted on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) (fast global CDN).

### Step 1: Deploy Backend (e.g., Render)

1. Push your repository to GitHub.
2. Log in to **Render** and click **New +** -> **Web Service**.
3. Select your repository.
4. Set the configuration:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/room_budget?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generate-a-strong-random-key>`
   - `BASE_URL`: `<URL of your deployed frontend, e.g. https://my-room-budget.vercel.app>`
   - `ADMIN_SECRET_CODE`: `<your-admin-passcode>`
6. Deploy! Render will provide your backend URL (e.g., `https://room-budget-api.onrender.com`).
7. Verify by opening `https://room-budget-api.onrender.com/health` in your browser. You should see `{"status":"ok","dbState":"connected"}`.

### Step 2: Deploy Frontend (e.g., Vercel)

1. Log in to **Vercel** and click **Add New...** -> **Project**.
2. Select your repository.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://room-budget-api.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://room-budget-api.onrender.com`
5. Click **Deploy**.
6. Copy your frontend production URL (e.g. `https://my-room-budget.vercel.app`) and ensure you update `BASE_URL` in your backend Render environment variables to allow CORS and Socket.IO handshakes.

---

## 🔍 Deployment Readiness Checklist

| Category | Item | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Scripts** | `npm start` in `backend/package.json` | ✅ Ready | Points directly to `node server.js` |
| **Scripts** | `npm run build` in `frontend/package.json` | ✅ Ready | Vite compiles cleanly to `frontend/dist` |
| **Logging** | HTTP Request Logger | ✅ Ready | Integrated request/response timestamped logger |
| **Logging** | Unhandled Process Handlers | ✅ Ready | Handlers for `unhandledRejection` & `uncaughtException` |
| **Monitoring** | Health Checks | ✅ Ready | `/health` and `/api/health` endpoints available |
| **Network** | CORS Configuration | ✅ Ready | Configurable via `BASE_URL` |
| **WebSockets** | Socket.IO Authentication & CORS | ✅ Ready | Bearer / token verification implemented |
| **Security** | Passwords | ✅ Ready | Hashed via `bcryptjs` (salt factor 10) |
| **Security** | Tokens | ✅ Ready | JWT with verification middleware |
| **Database** | MongoDB Atlas IP Access | ⚠️ Action Required | Must set Network Access to `0.0.0.0/0` in Atlas |
| **Secrets** | Environment Variables | ⚠️ Action Required | Must set env variables in cloud hosting dashboards |

---

## 📡 API Endpoints Overview

### Health
- `GET /health` or `GET /api/health` - Service and database status check

### Authentication & User
- `POST /api/users/register` - Create account (supports optional admin passcode)
- `POST /api/users/login` - Authenticate user & return JWT
- `GET /api/users/status` - Check current room membership and join requests
- `GET /protected` - Validate JWT token authentication

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/join` - Request to join a room
- `POST /api/rooms/leave` - Request to leave room

### Expenses & Budget
- `GET /api/expenses/:roomId` - Retrieve room expenses
- `POST /api/expenses` - Create a new expense (auto-categorized)
- `PUT /api/expenses/:expenseId` - Update an expense
- `DELETE /api/expenses/:expenseId` - Delete an expense
- `GET /api/budget/:roomId` - Get current month budget & member charges

### Settlements & Dashboard
- `GET /api/settlements/:roomId` - View settlements status
- `POST /api/settlements/settle` - Mark settlement as completed
- `GET /api/dashboard/:roomId` - Room stats, breakdowns, balances, and charts

### Notifications & Admin
- `GET /api/notifications/:roomId` - List recent notifications and alerts
- `POST /api/notifications/:id/resolve` - Dismiss/resolve alerts
- `GET /api/admin/*` - Admin controls for member approval, removal, and room settings

---

## ⚡ WebSocket Events

| Event | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `join-room` | Client ➔ Server | `{ roomId, token }` | Authenticates socket and joins room channel |
| `expenses-updated` | Server ➔ Client | — | Triggered when expenses are created/updated |
| `settlements-updated` | Server ➔ Client | — | Triggered when settlements are updated |
| `alert-resolved` | Server ➔ Client | — | Triggered when alerts/notifications change |
| `join-room-error` | Server ➔ Client | `{ message }` | Dispatched if token/room validation fails |

---

## 🛠️ Maintenance & Tracking

To track updates and push fixes:
```bash
git add .
git commit -m "chore: configure deployment scripts, logging, and documentation"
git push origin main
```
Once pushed to your main branch, connected services (Vercel, Render) will automatically trigger a new deployment build.
