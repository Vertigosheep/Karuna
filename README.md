# Karuna

**Karuna** helps NGOs and communities identify urgent needs and efficiently assign volunteers. It combines a React frontend, a Node.js + Express backend, and a Python FastAPI ML service into a single monorepo.

---

## Features

| Feature | Description |
|---------|-------------|
| **Issue reporting** | Community members submit issues with title, description, category, and GPS coordinates |
| **Priority scoring** | Automatic score using `0.4×severity + 0.3×frequency + 0.3×location_density` |
| **ML analysis** | FastAPI service extracts keywords, category, and severity from issue text |
| **Volunteer assignment** | Closest available volunteer with matching skills is auto-assigned |
| **Interactive map** | Leaflet map with colour-coded markers (red=high, yellow=medium, green=low priority) |
| **Role-based access** | Admin, Volunteer, and Member roles with protected routes |
| **In-app notifications** | Toast notifications + background polling for new task assignments |

---

## Architecture

```
karuna/
├── frontend/        React 18 + Vite 5 + Tailwind CSS + React Router + Leaflet
├── backend/         Node.js 18 + Express 4 + Mongoose + JWT + bcryptjs
└── ml-service/      Python 3.10 + FastAPI + Uvicorn (pure keyword matching)
```

Each service runs independently on its own port. There are no shared runtime dependencies at the root level.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | bundled with Node.js |
| Python | ≥ 3.10 |
| pip | bundled with Python |
| MongoDB | ≥ 6 (local or Atlas) |

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd karuna
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET (see Environment Variables below)
npm install
npm run dev
```

Server starts at **http://localhost:5000**

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "message": "Server running" }
```

### 3. ML Service

```bash
cd ml-service
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload
```

Service starts at **http://localhost:8000**

```bash
curl http://localhost:8000/health
# → { "status": "ok" }
```

Interactive API docs: **http://localhost:8000/docs**

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App starts at **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/karuna
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Express listen port (default: `5000`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `ML_SERVICE_URL` | No | ML service base URL (default: `http://localhost:8000`) |

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

This file is already created. Change the URL if your backend runs on a different port.

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |

### Issues

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/issues` | — | Create a new issue |
| GET | `/api/issues` | — | List all issues (sorted by priority) |
| GET | `/api/issues/my-tasks` | Bearer | Volunteer's assigned issues |
| GET | `/api/issues/:id` | — | Get issue by ID |
| PATCH | `/api/issues/:id/status` | Bearer | Update issue status |

### Assignment

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/assign` | Bearer | Auto-assign top pending issue to closest volunteer |

### ML Service

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Analyse text → keywords, category, severity_score |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| `user` | Register, login, report issues, view dashboard and map |
| `volunteer` | All of the above + view assigned tasks, mark complete/reject |
| `admin` | All of the above + admin dashboard, trigger volunteer assignment |

---

## Project Structure

```
backend/src/
├── controllers/     authController, issueController, assignController
├── middleware/      authMiddleware (protect)
├── models/          User, Issue
├── routes/          authRoutes, issueRoutes, assignRoutes
├── services/        mlService, priorityService, assignmentService
├── utils/           haversine
└── index.js         Express app entry point

frontend/src/
├── api/             auth.js, issues.js, client.js
├── components/      Navbar, PriorityBadge, IssueMap, ToastContainer,
│                    Skeleton, ErrorMessage, ErrorBoundary, ProtectedRoute
├── context/         AuthContext, NotificationContext
├── hooks/           useFetch, useTaskPolling
├── layouts/         MainLayout
└── pages/           Login, Register, Dashboard, ReportIssue,
                     AdminDashboard, VolunteerDashboard, IssueMapPage

ml-service/
├── main.py          FastAPI app + /health + /analyze endpoints
├── analyzer.py      extract_keywords, categorize, severity_score
└── requirements.txt fastapi, uvicorn, pydantic
```

---

## Priority Score Formula

```
priorityScore = (0.4 × severity) + (0.3 × frequency) + (0.3 × locationDensity)

severity        = mlAnalysis.severityScore  (0–1, from ML service)
frequency       = min(sameCategory count / 10, 1.0)
locationDensity = min(issues within ±0.1° / 10, 1.0)
```

Score is computed synchronously on issue creation (severity=0), then recalculated in the background after ML analysis completes.

---

## Volunteer Assignment Algorithm

1. Find the highest-priority `pending` issue
2. Find all users with `role=volunteer` and `availability=true`
3. Filter by skill match (`skills` includes `issue.category`) — falls back to all if none match
4. Sort by Haversine distance to the issue location
5. Assign the closest volunteer; set `issue.status=assigned`, `volunteer.availability=false`

---

## Development Notes

- **No sockets required** — volunteer notifications use 30-second polling via `useTaskPolling`
- **ML failures are non-blocking** — if the ML service is down, issues are still created with `mlAnalysis.analyzed=false`
- **JWT expiry** — expired tokens are detected on page load and cleared automatically
- **AbortController** — all `useFetch` calls cancel in-flight requests on unmount or re-fetch

---

## Running All Services Together

Open three terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — ML Service
cd ml-service && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.
