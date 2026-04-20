# Design Document

## Overview

This document describes the technical design for the Karuna monorepo — a full-stack platform helping NGOs identify urgent community needs and assign volunteers. It covers the monorepo scaffold, backend API (auth, issues, assignment), ML service (text analysis), and all integration points.

---

## Architecture

Flat monorepo — three independently runnable services, no shared root package manager workspace.

```
karuna/
├── .gitignore
├── README.md
├── frontend/               ← React + Vite SPA (port 5173)
├── backend/                ← Node.js + Express REST API (port 5000)
└── ml-service/             ← Python + FastAPI ML service (port 8000)
```

---

## Backend Directory Structure

```
backend/
├── .env / .env.example
├── package.json
└── src/
    ├── index.js
    ├── models/
    │   ├── User.js
    │   └── Issue.js
    ├── controllers/
    │   ├── authController.js
    │   ├── issueController.js
    │   └── assignController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── issueRoutes.js
    │   └── assignRoutes.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── services/
    │   ├── mlService.js
    │   ├── priorityService.js
    │   └── assignmentService.js
    └── utils/
        └── haversine.js
```

---

## Component Design

### 1. User Model (`src/models/User.js`)

```js
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['admin', 'volunteer', 'user'], default: 'user' },
  // Volunteer profile fields
  skills:       { type: [String], default: [] },
  availability: { type: Boolean, default: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });
```

### 2. Issue Model (`src/models/Issue.js`)

```js
const issueSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  category:      { type: String, required: true, enum: ['food','shelter','medical','education','other'] },
  status:        { type: String, enum: ['pending','assigned','completed'], default: 'pending' },
  priorityScore: { type: Number, default: 0 },
  assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mlAnalysis: {
    keywords:      { type: [String], default: [] },
    category:      { type: String,  default: '' },
    severityScore: { type: Number,  default: 0 },
    analyzed:      { type: Boolean, default: false },
  },
}, { timestamps: true });
```

### 3. Auth (`src/controllers/authController.js`)

- `POST /api/auth/register` — bcrypt hash (rounds=12), 409 on duplicate email, returns `{name, email, role}`
- `POST /api/auth/login` — bcrypt compare, returns `{ token }` (JWT signed with `JWT_SECRET`, expires `JWT_EXPIRES_IN`)
- `protect` middleware — extracts Bearer token, verifies, attaches `req.user`

### 4. Issue Management (`src/controllers/issueController.js`)

- `POST /api/issues` — validates fields + coordinates, calls `computePriority(severity=0)` before save, responds 201 immediately, fires ML enrichment + priority recalculation in background
- `GET /api/issues` — sorted by `priorityScore` desc, then `createdAt` desc
- `GET /api/issues/:id` — 400 on invalid ObjectId, 404 if not found

### 5. Priority Scoring (`src/services/priorityService.js`)

```
priorityScore = (0.4 × severity) + (0.3 × frequency) + (0.3 × locationDensity)

frequency       = min(sameCategoryCount / FREQ_CAP,    1.0)   FREQ_CAP=10
locationDensity = min(nearbyCount       / DENSITY_CAP, 1.0)   DENSITY_CAP=10, RADIUS_DEG=0.1
```

All components clamped to `[0,1]`. Result rounded to 4 decimal places.

### 6. ML Integration (`src/services/mlService.js`)

- `analyzeText(text)` — POST to `${ML_SERVICE_URL}/analyze`, 5s timeout, returns `null` on any failure
- Called fire-and-forget after issue save; on success, patches `mlAnalysis` + recalculates `priorityScore`

### 7. Haversine Utility (`src/utils/haversine.js`)

```js
const R = 6371; // km
function haversine(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### 8. Assignment Service (`src/services/assignmentService.js`)

Five-step algorithm:
1. Find highest-priority `pending` issue (sort `priorityScore` desc)
2. Find all volunteers with `role='volunteer'` and `availability=true`
3. Skill filter: keep volunteers whose `skills` includes `issue.category`; fall back to all if none match
4. Sort by Haversine distance to issue; volunteers with no location ranked last (`Infinity`)
5. Assign: `issue.status='assigned'`, `issue.assignedTo=volunteer._id`, `volunteer.availability=false`

Returns `{ issue, volunteer }` or `{ error: 'NO_PENDING_ISSUES' | 'NO_VOLUNTEERS' }`.

### 9. Assignment Controller (`src/controllers/assignController.js`)

- `POST /api/assign` (protected) — calls `assignVolunteer()`, maps error codes to HTTP 404, returns `{ issue, volunteer: {id, name, email} }`

### 10. ML Service (`ml-service/`)

- `GET /health` → `{ status: 'ok' }`
- `POST /analyze` → `{ keywords: string[], category: string, severity_score: float }`
- Pure Python keyword matching in `analyzer.py` — no external NLP deps

---

## Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `PORT` | backend | `5000` | Express listen port |
| `MONGO_URI` | backend | — | MongoDB connection string |
| `JWT_SECRET` | backend | — | JWT signing secret |
| `JWT_EXPIRES_IN` | backend | `7d` | JWT token lifetime |
| `ML_SERVICE_URL` | backend | `http://localhost:8000` | ML service base URL |

---

## Correctness Properties

### Property 1: JSON middleware round-trip
For any valid JSON value V, POST with body V → `req.body` deep-equals V.

### Property 2: Health endpoint determinism
`GET /api/health` always returns HTTP 200 `{ status:'ok', message:'Server running' }`.

### Property 3: ML health endpoint
`GET /health` always returns HTTP 200 `{ status:'ok' }`.

### Property 4: PORT override
Server binds to `PORT` env var, defaults to 5000.

### Property 5: Password never stored in plaintext
For any password P, stored hash ≠ P and `bcrypt.compare(P, hash)` = true.

### Property 6: Duplicate email rejection
Second registration with same email → HTTP 409.

### Property 7: Invalid credentials rejection
Login with wrong password or unknown email → HTTP 401.

### Property 8: JWT round-trip
Token from login accepted by `protect` middleware; `req.user._id` matches registered user.

### Property 9: Issue creation — required fields
Missing `title`, `description`, or `category` → HTTP 400.

### Property 10: Issue creation — location coordinates
Non-finite `location.lat` or `location.lng` → HTTP 400.

### Property 11: GET /api/issues completeness
After N creates, GET returns array of length ≥ N containing all created ids.

### Property 12: GET /api/issues/:id round-trip
`_id` from POST retrievable via GET/:id → HTTP 200 with matching fields.

### Property 13: GET /api/issues/:id error handling
Invalid ObjectId → 400; valid format but missing → 404.

### Property 14: /analyze stop words excluded
No STOP_WORDS member appears in `keywords`.

### Property 15: /analyze category validity
`category` ∈ `{food, shelter, medical, education, other}` for any input.

### Property 16: /analyze severity_score range
`0.0 ≤ severity_score ≤ 1.0` for any input.

### Property 17: ML failure non-blocking
With ML service offline, POST /api/issues → HTTP 201, `mlAnalysis.analyzed = false`.

### Property 18: priorityScore range
`0.0 ≤ priorityScore ≤ 1.0` for any valid issue creation.

### Property 19: priorityScore formula
`priorityScore = round4((0.4×s) + (0.3×f) + (0.3×ld))` for known inputs.

### Property 20: Assignment picks closest volunteer
Given N volunteers with known locations, assigned volunteer has minimum Haversine distance to issue.

### Property 21: Haversine symmetry
`haversine(a,b,c,d) === haversine(c,d,a,b)` for any valid coordinates.

### Property 22: Haversine self-distance
`haversine(lat,lng,lat,lng) === 0`.

---

## Open Questions / Deferred Decisions

| # | Question | Deferred to |
|---|----------|-------------|
| 1 | Should the root use npm workspaces? | Feature development phase |
| 2 | Add docker-compose.yml? | DevOps / deployment phase |
| 3 | CORS origin policy in production? | API feature development |
| 4 | ML service port via env var? | ML feature development |
