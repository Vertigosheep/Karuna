# Requirements Document

## Introduction

Karuna is a full-stack monorepo project that helps NGOs and communities identify urgent needs and efficiently assign volunteers. This document covers the scaffolding and initial setup of the monorepo — no application features are implemented at this stage. The goal is to establish a clean, well-documented project structure where each application (frontend, backend, and ML service) can be developed and run independently.

## Glossary

- **Monorepo**: A single version-controlled repository containing multiple distinct applications or packages.
- **Frontend**: The React (Vite) web application located at `/frontend`.
- **Backend**: The Node.js + Express REST API located at `/backend`.
- **ML_Service**: The Python FastAPI machine-learning service located at `/ml-service`.
- **Scaffold**: The minimal directory structure, configuration files, and entry points needed to run an application, without any business logic.
- **Root**: The top-level directory of the monorepo repository.
- **Developer**: A person who clones and sets up the Karuna repository locally.

---

## Requirements

### Requirement 1: Monorepo Root Structure

**User Story:** As a Developer, I want a clean root-level directory layout, so that I can navigate the project and understand its structure at a glance.

#### Acceptance Criteria

1. THE Monorepo SHALL contain exactly three top-level application directories: `frontend/`, `backend/`, and `ml-service/`.
2. THE Root SHALL contain a `README.md` file at the top level.
3. THE Root SHALL contain a `.gitignore` file at the top level that excludes common OS, editor, and dependency artifacts.
4. THE Root SHALL NOT contain application source code or business logic files outside of the three application directories.

---

### Requirement 2: Frontend Scaffold (React + Vite)

**User Story:** As a Developer, I want a bootstrapped React + Vite application in the `frontend/` directory, so that I can start building the user interface without manual setup.

#### Acceptance Criteria

1. THE Frontend SHALL be initialised using Vite with the React template, producing a runnable development server.
2. THE Frontend SHALL contain a `package.json` with a `dev` script that starts the Vite development server.
3. THE Frontend SHALL contain a `vite.config.js` (or `vite.config.ts`) configuration file.
4. THE Frontend SHALL contain a `.gitignore` file that excludes `node_modules/`, `dist/`, and Vite cache directories.
5. WHEN a Developer runs `npm install` followed by `npm run dev` inside `frontend/`, THE Frontend SHALL start without errors on a local port.

---

### Requirement 3: Backend Scaffold (Node.js + Express)

**User Story:** As a Developer, I want a minimal Express application in the `backend/` directory, so that I can start building API endpoints without manual setup.

#### Acceptance Criteria

1. THE Backend SHALL use Node.js and the Express framework as its sole HTTP server runtime.
2. THE Backend SHALL contain a `package.json` with a `start` script that launches the Express server using `node` and a `dev` script that launches the server using `nodemon` for automatic restarts on file changes.
3. THE Backend SHALL contain an entry-point file (`src/index.js`) that creates an Express application instance and listens on the port defined by the `PORT` environment variable.
4. THE Backend SHALL register `express.json()` middleware so that incoming requests with a JSON body are automatically parsed.
5. THE Backend SHALL register the `cors` middleware so that cross-origin requests from the Frontend are accepted.
6. THE Backend SHALL read environment variables from a `.env` file in the `backend/` directory using the `dotenv` package, with `PORT` defaulting to `5000` when the variable is not set.
7. THE Backend SHALL expose a health-check route `GET /api/health` that returns HTTP 200 with a JSON body `{ "status": "ok", "message": "Server running" }`.
8. THE Backend SHALL contain a `.gitignore` file that excludes `node_modules/` and environment variable files (`.env`).
9. WHEN a Developer runs `npm install` followed by `npm start` inside `backend/`, THE Backend SHALL start without errors on `localhost:5000` and respond to `GET /api/health`.
10. WHEN a Developer runs `npm run dev` inside `backend/`, THE Backend SHALL start via `nodemon` and automatically restart when source files are modified.

---

### Requirement 4: ML Service Scaffold (Python + FastAPI)

**User Story:** As a Developer, I want a minimal FastAPI application in the `ml-service/` directory, so that I can start building machine-learning endpoints without manual setup.

#### Acceptance Criteria

1. THE ML_Service SHALL contain a `requirements.txt` file listing `fastapi` and `uvicorn` as dependencies with pinned major versions.
2. THE ML_Service SHALL contain an entry-point file (e.g., `main.py`) that creates a FastAPI application instance.
3. THE ML_Service SHALL expose a health-check route (`GET /health`) that returns HTTP 200 with a JSON body `{ "status": "ok" }`.
4. THE ML_Service SHALL contain a `.gitignore` file that excludes Python virtual environments (`venv/`, `.venv/`), `__pycache__/`, and `.pyc` files.
5. WHEN a Developer installs dependencies via `pip install -r requirements.txt` and runs `uvicorn main:app` inside `ml-service/`, THE ML_Service SHALL start without errors and respond to `GET /health`.

---

### Requirement 5: Independent Execution

**User Story:** As a Developer, I want each application to run independently of the others, so that I can develop and test each service in isolation.

#### Acceptance Criteria

1. THE Frontend SHALL start successfully without the Backend or ML_Service being running.
2. THE Backend SHALL start successfully without the Frontend or ML_Service being running.
3. THE ML_Service SHALL start successfully without the Frontend or Backend being running.
4. THE Monorepo SHALL NOT contain a shared runtime dependency that must be installed at the root before any individual application can start.

---

### Requirement 6: Root README Documentation

**User Story:** As a Developer, I want a comprehensive README at the root of the repository, so that I can set up and run the entire project by following a single document.

#### Acceptance Criteria

1. THE Root README SHALL contain a project overview section describing the purpose of Karuna.
2. THE Root README SHALL contain a prerequisites section listing required tools (Node.js version, Python version, npm/pip).
3. THE Root README SHALL contain step-by-step setup instructions for each of the three applications.
4. THE Root README SHALL contain the exact commands needed to start each application in development mode.
5. THE Root README SHALL contain a directory structure section that maps each folder to its role.
6. WHEN a Developer follows the README instructions on a clean machine with the listed prerequisites installed, THE Developer SHALL be able to run all three applications without consulting any other documentation.

---

### Requirement 7: Root .gitignore Coverage

**User Story:** As a Developer, I want a root-level `.gitignore` that covers all three technology stacks, so that generated and dependency files are never accidentally committed.

#### Acceptance Criteria

1. THE Root `.gitignore` SHALL exclude Node.js dependency directories (`node_modules/`) for both Frontend and Backend.
2. THE Root `.gitignore` SHALL exclude Python virtual environment directories (`venv/`, `.venv/`) and compiled Python files (`__pycache__/`, `*.pyc`).
3. THE Root `.gitignore` SHALL exclude build output directories (`dist/`, `build/`).
4. THE Root `.gitignore` SHALL exclude environment variable files (`.env`, `.env.local`, `.env.*.local`).
5. THE Root `.gitignore` SHALL exclude common OS-generated files (`.DS_Store`, `Thumbs.db`).
6. THE Root `.gitignore` SHALL exclude common editor/IDE metadata directories (`.vscode/`, `.idea/`).

---

### Requirement 8: User Authentication

**User Story:** As a Developer, I want a complete user authentication system in the backend, so that the application can register users, authenticate them with secure credentials, and protect routes from unauthorised access.

#### Acceptance Criteria

1. THE Backend SHALL define a `User` Mongoose schema with the following fields:
   - `name` — String, required
   - `email` — String, required, unique
   - `password` — String, required (stored as a bcrypt hash, never plaintext)
   - `role` — String enum with values `admin`, `volunteer`, `user`; defaults to `user`

2. THE Backend SHALL expose a `POST /api/auth/register` endpoint that:
   - Accepts a JSON body with `name`, `email`, `password`, and optional `role`
   - Rejects registration if a user with the same `email` already exists, returning HTTP 409
   - Hashes the password using `bcryptjs` before persisting the user document
   - Returns HTTP 201 with a JSON body containing the created user's `name`, `email`, and `role` (password field excluded from response)

3. THE Backend SHALL expose a `POST /api/auth/login` endpoint that:
   - Accepts a JSON body with `email` and `password`
   - Returns HTTP 401 if the email does not match any registered user
   - Returns HTTP 401 if the provided password does not match the stored hash
   - Returns HTTP 200 with a JSON body `{ "token": "<JWT>" }` on successful authentication

4. THE Backend SHALL use `bcryptjs` for all password hashing and comparison operations.

5. THE Backend SHALL use `jsonwebtoken` to sign and verify authentication tokens:
   - Tokens SHALL be signed with the secret defined in the `JWT_SECRET` environment variable
   - Token expiry SHALL be controlled by the `JWT_EXPIRES_IN` environment variable (e.g., `"7d"`)

6. THE Backend SHALL provide an `auth` middleware (`protect`) that:
   - Reads the `Authorization` header and extracts a Bearer token
   - Verifies the token using `JWT_SECRET`
   - Attaches the decoded user payload to `req.user` on success
   - Returns HTTP 401 if the token is missing, malformed, or expired

7. THE Backend SHALL organise authentication code in a modular structure:
   - `src/models/User.js` — Mongoose User schema and model
   - `src/controllers/authController.js` — register and login handler functions
   - `src/routes/authRoutes.js` — Express router mounting the auth endpoints
   - `src/middleware/authMiddleware.js` — `protect` middleware function

8. THE Backend `.env.example` SHALL document the three new required environment variables: `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`.

9. THE Backend SHALL connect to MongoDB using the `MONGO_URI` environment variable via Mongoose on application startup, logging a success message on connection and an error message on failure.

---

### Requirement 9: Issue Management

**User Story:** As a community member or NGO operator, I want to create and browse urgent community issues, so that needs can be tracked and volunteers can be assigned efficiently.

#### Acceptance Criteria

1. THE Backend SHALL define an `Issue` Mongoose schema with the following fields:
   - `title` — String, required, trimmed
   - `description` — String, required
   - `location` — Object with `lat` (Number, required) and `lng` (Number, required)
   - `category` — String, required (e.g. `"food"`, `"shelter"`, `"medical"`, `"education"`, `"other"`)
   - `status` — String enum `['pending', 'assigned', 'completed']`, defaults to `'pending'`
   - `priorityScore` — Number, defaults to `0`
   - `createdAt` — Date, automatically set by Mongoose timestamps

2. THE Backend SHALL expose `POST /api/issues` that:
   - Accepts a JSON body with `title`, `description`, `location`, `category`, and optional `priorityScore`
   - Returns HTTP 400 with a descriptive message if any required field is missing or invalid
   - Returns HTTP 400 if `location.lat` or `location.lng` is not a finite number
   - Persists the issue document and returns HTTP 201 with the created issue object

3. THE Backend SHALL expose `GET /api/issues` that:
   - Returns HTTP 200 with a JSON array of all issue documents, sorted by `createdAt` descending
   - Returns an empty array `[]` when no issues exist

4. THE Backend SHALL expose `GET /api/issues/:id` that:
   - Returns HTTP 200 with the matching issue document when a valid MongoDB ObjectId is provided and the document exists
   - Returns HTTP 404 with `{ "message": "Issue not found" }` when no document matches the given id
   - Returns HTTP 400 with `{ "message": "Invalid issue id" }` when the provided `:id` is not a valid MongoDB ObjectId

5. THE Backend SHALL organise issue management code in a modular structure:
   - `src/models/Issue.js` — Mongoose Issue schema and model
   - `src/controllers/issueController.js` — `createIssue`, `getIssues`, `getIssueById` handler functions
   - `src/routes/issueRoutes.js` — Express router mounting the issue endpoints

6. THE Backend SHALL mount issue routes at `/api/issues` in `src/index.js`.

7. ALL issue endpoints SHALL return consistent JSON error responses with a `message` field on failure.

---

### Requirement 10: ML Service — Text Analysis Endpoint

**User Story:** As a backend service, I want to send raw issue text to the ML service and receive structured analysis, so that issues can be automatically categorised and prioritised without manual review.

#### Acceptance Criteria

1. THE ML_Service SHALL expose `POST /analyze` that:
   - Accepts a JSON body `{ "text": "<string>" }`
   - Returns HTTP 422 if `text` is missing or not a string (FastAPI default validation)
   - Returns HTTP 200 with a JSON body `{ "keywords": [...], "category": "<string>", "severity_score": <float 0–1> }`

2. THE `keywords` field SHALL be a list of significant words extracted from the input text using lightweight keyword matching (no ML model training required).

3. THE `category` field SHALL be one of: `"food"`, `"shelter"`, `"medical"`, `"education"`, `"other"` — determined by matching keywords against predefined category word lists.

4. THE `severity_score` field SHALL be a float between 0.0 and 1.0 — computed by counting how many high-severity indicator words (e.g. "urgent", "critical", "emergency", "danger", "immediate") appear in the text, normalised to the range [0, 1].

5. THE ML_Service SHALL use only the Python standard library plus `fastapi` and `uvicorn` — no spaCy, no NLTK, no model downloads required.

6. THE ML_Service `requirements.txt` SHALL remain minimal: `fastapi`, `uvicorn`, and `pydantic` only (all pinned).

7. WHEN a Developer runs `uvicorn main:app --reload` inside `ml-service/`, THE service SHALL start on `localhost:8000` and respond to `POST /analyze` without any additional setup steps.

---

### Requirement 11: ML Service Integration in Issue Creation

**User Story:** As a system operator, I want newly created issues to be automatically enriched with ML-derived keywords, category, and severity score, so that issues can be prioritised and routed without manual tagging.

#### Acceptance Criteria

1. WHEN `POST /api/issues` successfully persists a new issue, THE Backend SHALL asynchronously call `POST /analyze` on the ML service with `{ "text": "<issue description>" }`.

2. THE Backend SHALL read the ML service base URL from the `ML_SERVICE_URL` environment variable, defaulting to `http://localhost:8000`.

3. IF the ML service responds successfully, THE Backend SHALL update the issue document with:
   - `mlAnalysis.keywords` — array of strings from the ML response
   - `mlAnalysis.category` — string from the ML response
   - `mlAnalysis.severityScore` — float from the ML response
   - `mlAnalysis.analyzed` — `true`

4. IF the ML service call fails for any reason (network error, timeout, non-2xx response), THE Backend SHALL:
   - Log the error to the console
   - Leave the issue document with `mlAnalysis.analyzed = false`
   - Still return HTTP 201 with the created issue to the client (ML failure must not block issue creation)

5. THE `POST /api/issues` response SHALL always return immediately after persisting the issue — the ML enrichment SHALL happen in the background and SHALL NOT add latency to the HTTP response.

6. THE Issue Mongoose schema SHALL be extended with an `mlAnalysis` sub-document:
   - `keywords` — Array of String, default `[]`
   - `category` — String, default `""`
   - `severityScore` — Number, default `0`
   - `analyzed` — Boolean, default `false`

7. THE Backend SHALL encapsulate the ML service HTTP call in a dedicated module `src/services/mlService.js` that exports a single `analyzeText(text)` function returning the parsed response or `null` on failure.

8. THE `backend/.env.example` SHALL document the `ML_SERVICE_URL` variable.

---

### Requirement 12: Priority Scoring

**User Story:** As a system operator, I want each issue to have a computed priority score so that the most urgent, frequent, and geographically dense problems surface first.

#### Acceptance Criteria

1. THE Backend SHALL compute a `priorityScore` for every issue using the formula:
   ```
   priorityScore = (0.4 × severity) + (0.3 × frequency) + (0.3 × locationDensity)
   ```
   where all three input components are normalised floats in `[0, 1]`.

2. THE `severity` component SHALL be sourced from `mlAnalysis.severityScore` (the value returned by the ML service). If ML analysis has not yet completed, `severity` SHALL default to `0`.

3. THE `frequency` component SHALL be computed as:
   ```
   frequency = min(sameCategoryCount / FREQ_CAP, 1.0)
   ```
   where `sameCategoryCount` is the number of existing issues in the database with the same `category` as the new issue, and `FREQ_CAP` is a configurable constant (default `10`).

4. THE `locationDensity` component SHALL be computed as:
   ```
   locationDensity = min(nearbyCount / DENSITY_CAP, 1.0)
   ```
   where `nearbyCount` is the number of existing issues whose location is within a configurable radius (default `0.1` decimal degrees, ≈ 11 km) of the new issue's coordinates, and `DENSITY_CAP` is a configurable constant (default `10`).

5. THE computed `priorityScore` SHALL be stored in the `priorityScore` field of the Issue document in MongoDB, rounded to 4 decimal places.

6. THE priority score SHALL be (re)calculated for the new issue immediately after it is saved, before the HTTP 201 response is sent to the client — the response SHALL include the computed `priorityScore`.

7. THE Backend SHALL encapsulate all priority scoring logic in a dedicated module `src/services/priorityService.js` that exports a single `computePriority({ severity, category, location })` async function.

8. THE `computePriority` function SHALL query the database to obtain `sameCategoryCount` and `nearbyCount`, then apply the formula and return the rounded score.

9. ALL three input components SHALL be clamped to `[0, 1]` before applying the formula to guard against out-of-range inputs.

10. WHEN the ML analysis has not yet completed at the time of issue creation, the priority score SHALL be recalculated in the background after ML enrichment completes, updating both `mlAnalysis` and `priorityScore` in a single `findByIdAndUpdate` call.

---

### Requirement 13: Volunteer Profile Extension

**User Story:** As a volunteer, I want to register my skills, availability, and location so that I can be matched to issues I am qualified and close enough to handle.

#### Acceptance Criteria

1. THE `User` Mongoose schema SHALL be extended with:
   - `skills` — Array of String, default `[]` (e.g. `["medical", "food", "shelter"]`)
   - `availability` — Boolean, default `true`
   - `location` — Object with `lat` (Number) and `lng` (Number), both optional (not required at registration)

2. THE new fields SHALL be optional — existing registration and login flows SHALL continue to work without providing them.

3. THE `skills` array values SHALL be free-form strings; no enum constraint is applied at the schema level.

---

### Requirement 14: Volunteer Assignment Endpoint

**User Story:** As a system operator, I want to trigger automatic volunteer assignment so that the highest-priority unassigned issue is matched to the closest available qualified volunteer.

#### Acceptance Criteria

1. THE Backend SHALL expose `POST /api/assign` that executes the following assignment logic:

2. **Step 1 — Select issue**: Query for the highest-priority issue where `status = "pending"`, ordered by `priorityScore` descending. If no pending issue exists, return HTTP 404 with `{ "message": "No pending issues found" }`.

3. **Step 2 — Filter volunteers**: Query for all users where `role = "volunteer"` AND `availability = true`. If no available volunteers exist, return HTTP 404 with `{ "message": "No available volunteers found" }`.

4. **Step 3 — Skill filter**: From the available volunteers, retain only those whose `skills` array contains at least one value that matches the issue's `category`. If no volunteer passes the skill filter, fall back to all available volunteers (do not return an error).

5. **Step 4 — Sort by distance**: Compute the Haversine distance between each candidate volunteer's `location` and the issue's `location`. Sort candidates ascending by distance. Volunteers with no `location` set SHALL be ranked last.

6. **Step 5 — Assign**: Select the closest candidate. Update the issue: set `status = "assigned"` and `assignedTo = <volunteer _id>`. Update the volunteer: set `availability = false`.

7. THE endpoint SHALL return HTTP 200 with:
   ```json
   {
     "issue": { <updated issue document> },
     "volunteer": { "id": "...", "name": "...", "email": "..." }
   }
   ```

8. THE `Issue` schema SHALL be extended with `assignedTo` — ObjectId ref `'User'`, optional.

9. THE assignment logic SHALL be encapsulated in `src/services/assignmentService.js` exporting `assignVolunteer()`.

10. THE Haversine distance calculation SHALL be implemented as a pure utility function in `src/utils/haversine.js`.

11. THE `POST /api/assign` route SHALL be protected by the `protect` middleware (authenticated users only).
