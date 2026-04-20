# Implementation Plan: Karuna Monorepo Setup + Authentication

## Overview

This plan covers the full implementation of the Karuna monorepo scaffold — root structure, frontend, backend, and ML service — followed by the complete user authentication feature (User model, register/login endpoints, JWT middleware). Tasks are ordered so each step builds on the previous one, with no orphaned code.

---

## Tasks

- [x] 1. Create root monorepo structure
  - Create `.gitignore` at the repo root covering Node.js, Python, build outputs, env files, OS files, and editor metadata
  - Create `README.md` at the repo root with project overview, prerequisites (Node.js ≥ 18, Python ≥ 3.10, npm, pip), directory structure table, per-app setup and run commands, and environment variables reference
  - Ensure no application source code exists outside `frontend/`, `backend/`, and `ml-service/`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 2. Scaffold the frontend application
  - Initialise a Vite + React project in `frontend/` using `npm create vite@latest frontend -- --template react`
  - Verify `package.json` contains a `dev` script that starts the Vite dev server
  - Verify `vite.config.js` (or `vite.config.ts`) is present
  - Verify `frontend/.gitignore` excludes `node_modules/`, `dist/`, and Vite cache directories
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Scaffold the backend application
  - Create `backend/package.json` with `start` (`node src/index.js`) and `dev` (`nodemon src/index.js`) scripts and pinned dependencies: `express`, `cors`, `dotenv`; dev dependency: `nodemon`
  - Create `backend/src/index.js` that loads dotenv, creates an Express app, registers `cors()` and `express.json()` middleware, mounts `GET /api/health` returning `{ "status": "ok", "message": "Server running" }`, and listens on `process.env.PORT || 5000`
  - Create `backend/.env` (not committed) with `PORT=5000`
  - Create `backend/.env.example` (committed) documenting `PORT`
  - Create `backend/.gitignore` excluding `node_modules/` and `.env`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 3.1 Write integration tests for backend health endpoint and middleware
    - Test `GET /api/health` returns HTTP 200 and exact JSON body `{ "status": "ok", "message": "Server running" }` (Property 2)
    - Test PORT environment variable override: default 5000 and custom port (Property 4)
    - _Requirements: 3.7_

  - [ ]* 3.2 Write property test for JSON middleware round-trip
    - **Property 1: Backend JSON middleware round-trip**
    - **Validates: Requirements 3.4**
    - Use fast-check to generate arbitrary JSON-serialisable values; POST each to the backend and assert `req.body` deep-equals the original value

- [x] 4. Scaffold the ML service
  - Create `ml-service/requirements.txt` with pinned `fastapi==0.111.0` and `uvicorn==0.30.1`
  - Create `ml-service/main.py` with a FastAPI app instance and `GET /health` returning `{ "status": "ok" }`
  - Create `ml-service/.gitignore` excluding `venv/`, `.venv/`, `__pycache__/`, and `*.pyc`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.1 Write integration test for ML service health endpoint
    - Test `GET /health` returns HTTP 200 and `{ "status": "ok" }` (Property 3)
    - _Requirements: 4.3_

- [x] 5. Checkpoint — verify scaffold
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add authentication dependencies and environment configuration
  - Add `mongoose`, `bcryptjs`, and `jsonwebtoken` to `backend/package.json` dependencies (pinned versions)
  - Update `backend/.env.example` to document `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`
  - Update `backend/.env` with local values for the three new variables
  - _Requirements: 8.4, 8.5, 8.8_

- [x] 7. Implement the User Mongoose model
  - Create `backend/src/models/User.js` with a Mongoose schema containing `name` (String, required), `email` (String, required, unique, lowercase, trim), `password` (String, required), and `role` (String enum `['admin', 'volunteer', 'user']`, default `'user'`), with timestamps enabled
  - Export the compiled Mongoose model
  - _Requirements: 8.1_

  - [ ]* 7.1 Write unit tests for the User model schema
    - Test that a document missing required fields fails Mongoose validation
    - Test that `role` defaults to `'user'` when omitted
    - Test that an invalid `role` value fails enum validation
    - _Requirements: 8.1_

- [x] 8. Implement the auth controller (register)
  - Create `backend/src/controllers/authController.js`
  - Implement `exports.register`: check for duplicate email (return 409 if found), hash password with `bcryptjs` (salt rounds = 12), create and persist the User document, return HTTP 201 with `{ name, email, role }` (no password field)
  - _Requirements: 8.2, 8.4_

  - [ ]* 8.1 Write property test for password never stored in plaintext
    - **Property 5: Password never stored in plaintext**
    - **Validates: Requirements 8.2, 8.4**
    - Use fast-check to generate arbitrary non-empty password strings; after registration, query the DB directly and assert the stored field is not equal to the raw password and that `bcrypt.compare` returns true

  - [ ]* 8.2 Write property test for duplicate email rejection
    - **Property 6: Duplicate email rejection**
    - **Validates: Requirements 8.2**
    - Use fast-check to generate email-shaped strings; register once, then attempt a second registration with the same email and assert HTTP 409

- [x] 9. Implement the auth controller (login)
  - Add `exports.login` to `backend/src/controllers/authController.js`: look up user by email (return 401 if not found), compare password with `bcrypt.compare` (return 401 if mismatch), sign a JWT with `JWT_SECRET` and `JWT_EXPIRES_IN`, return HTTP 200 with `{ token }`
  - Add `signToken` helper that calls `jwt.sign`
  - _Requirements: 8.3, 8.5_

  - [ ]* 9.1 Write property test for invalid credentials rejection
    - **Property 7: Invalid credentials rejection**
    - **Validates: Requirements 8.3**
    - Use fast-check to generate (email, password) pairs; assert HTTP 401 for unregistered emails and for registered emails with wrong passwords

- [x] 10. Implement auth routes
  - Create `backend/src/routes/authRoutes.js` with an Express router that mounts `POST /register` → `register` and `POST /login` → `login`
  - _Requirements: 8.2, 8.3, 8.7_

- [x] 11. Implement the protect middleware
  - Create `backend/src/middleware/authMiddleware.js` with `exports.protect`: extract Bearer token from `Authorization` header (return 401 if missing), verify with `jwt.verify` and `JWT_SECRET`, attach decoded user (minus password) to `req.user`, call `next()` on success, return 401 on any error
  - _Requirements: 8.6_

  - [ ]* 11.1 Write property test for JWT token round-trip verification
    - **Property 8: JWT token round-trip verification**
    - **Validates: Requirements 8.5, 8.6**
    - Use fast-check to generate user registration payloads; register, log in, call a protected test route with the returned token, and assert HTTP 200 and that `req.user._id` matches the registered user

- [x] 12. Wire authentication into the Express app
  - Update `backend/src/index.js` to: `require('mongoose')`, connect to `process.env.MONGO_URI` before starting the server (log success/failure), and mount `authRoutes` at `/api/auth`
  - Move `app.listen` inside the Mongoose `.then()` callback so the server only starts after a successful DB connection
  - _Requirements: 8.7, 8.9_

- [x] 13. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement the Issue Mongoose model
  - Create `backend/src/models/Issue.js` with a Mongoose schema containing: `title` (String, required, trim), `description` (String, required), `location` object with `lat` and `lng` (Number, required), `category` (String, required, enum: food/shelter/medical/education/other), `status` (String enum pending/assigned/completed, default pending), `priorityScore` (Number, default 0), timestamps enabled
  - Export the compiled Mongoose model
  - _Requirements: 9.1_

- [x] 15. Implement the issue controller
  - Create `backend/src/controllers/issueController.js`
  - Implement `exports.createIssue`: validate required fields (title, description, category) → 400 if missing; validate location.lat and location.lng are finite numbers → 400 if invalid; create and return the issue with HTTP 201; handle Mongoose ValidationError → 400
  - Implement `exports.getIssues`: return all issues sorted by createdAt descending with HTTP 200
  - Implement `exports.getIssueById`: validate ObjectId format → 400 if invalid; find by id → 404 if not found; return issue with HTTP 200
  - _Requirements: 9.2, 9.3, 9.4, 9.7_

- [x] 16. Implement issue routes
  - Create `backend/src/routes/issueRoutes.js` with an Express router mounting: `POST /` → `createIssue`, `GET /` → `getIssues`, `GET /:id` → `getIssueById`
  - _Requirements: 9.5_

- [x] 17. Mount issue routes in the Express app
  - Update `backend/src/index.js` to require `./routes/issueRoutes` and mount it at `/api/issues`
  - _Requirements: 9.6_

- [x] 18. Final checkpoint — verify issue management
  - Verify all issue files exist and are wired correctly
  - Confirm the backend starts without errors

- [x] 19. Implement the ML service analyzer module
  - Create `ml-service/analyzer.py` with three pure-Python functions: `extract_keywords(text)` (tokenise, lowercase, strip punctuation, exclude stop words), `categorize(keywords)` (match against category word lists, return best match or "other"), `severity_score(text)` (count severity indicator words, normalise to 0–1)
  - No external dependencies beyond the Python standard library
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 20. Implement the /analyze endpoint
  - Update `ml-service/main.py` to add a Pydantic `AnalyzeRequest` model (`text: str`) and `AnalyzeResponse` model (`keywords`, `category`, `severity_score`)
  - Add `POST /analyze` route that calls the three analyzer functions and returns an `AnalyzeResponse`
  - Update `ml-service/requirements.txt` to add `pydantic==2.7.1`
  - _Requirements: 10.1, 10.6, 10.7_

- [x] 21. Final checkpoint — verify ML service
  - Verify all ml-service files are correct and the service structure is complete

- [ ] 22. Add axios dependency and ML_SERVICE_URL env var
  - Add `"axios": "^1.7.2"` to `backend/package.json` dependencies
  - Add `ML_SERVICE_URL=http://localhost:8000` to `backend/.env` and `backend/.env.example`
  - _Requirements: 11.2, 11.8_

- [ ] 23. Extend Issue schema with mlAnalysis sub-document
  - Add `mlAnalysis` object to `backend/src/models/Issue.js` with fields: `keywords` (Array of String, default []), `category` (String, default ""), `severityScore` (Number, default 0), `analyzed` (Boolean, default false)
  - _Requirements: 11.6_

- [ ] 24. Implement mlService helper
  - Create `backend/src/services/mlService.js` exporting `analyzeText(text)` that POSTs to `${ML_SERVICE_URL}/analyze` with a 5-second timeout using axios, returns parsed response on success, logs error and returns null on any failure
  - _Requirements: 11.2, 11.4, 11.7_

- [ ] 25. Update createIssue to call ML service
  - Update `backend/src/controllers/issueController.js` to: respond with HTTP 201 immediately after saving the issue, then fire-and-forget call `analyzeText(description)` and patch the issue document with `mlAnalysis` fields if the call succeeds
  - _Requirements: 11.1, 11.3, 11.4, 11.5_

- [ ] 26. Final checkpoint — verify ML integration
  - Verify all new files exist and issueController is updated correctly

- [ ] 27. Implement priorityService
  - Create `backend/src/services/priorityService.js` exporting `computePriority({ severity, category, location })` async function
  - Query DB for `sameCategoryCount` (same category) and `nearbyCount` (within RADIUS_DEG=0.1 degrees)
  - Apply formula: `(0.4 × clamp(severity)) + (0.3 × clamp(sameCategoryCount/10)) + (0.3 × clamp(nearbyCount/10))`
  - Return score rounded to 4 decimal places
  - _Requirements: 12.3, 12.4, 12.7, 12.8, 12.9_

- [ ] 28. Integrate priority scoring into createIssue
  - Update `backend/src/controllers/issueController.js` to call `computePriority` before saving (severity=0 initially), store result in `priorityScore`, include it in the 201 response
  - After ML enrichment completes in background, call `computePriority` again with the real severity score and update both `mlAnalysis` and `priorityScore` in a single `findByIdAndUpdate`
  - _Requirements: 12.1, 12.2, 12.5, 12.6, 12.10_

- [ ] 29. Final checkpoint — verify priority scoring
  - Verify priorityService.js exists, issueController uses it, and the 201 response includes a priorityScore

- [ ] 30. Extend User model with volunteer fields
  - Add `skills` ([String], default []), `availability` (Boolean, default true), `location.lat` (Number, optional), `location.lng` (Number, optional) to `backend/src/models/User.js`
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 31. Extend Issue model with assignedTo field
  - Add `assignedTo` (ObjectId ref 'User', optional) to `backend/src/models/Issue.js`
  - _Requirements: 14.8_

- [ ] 32. Implement haversine utility
  - Create `backend/src/utils/haversine.js` exporting `haversine(lat1, lng1, lat2, lng2)` returning distance in km
  - _Requirements: 14.10_

- [ ] 33. Implement assignmentService
  - Create `backend/src/services/assignmentService.js` exporting `assignVolunteer()` implementing the 5-step algorithm: find top pending issue → filter available volunteers → skill filter with fallback → sort by Haversine → assign both documents
  - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6, 14.9_

- [ ] 34. Implement assign controller and route
  - Create `backend/src/controllers/assignController.js` with `postAssign` handler calling `assignVolunteer()`, mapping error codes to 404, returning `{ issue, volunteer: {id, name, email} }`
  - Create `backend/src/routes/assignRoutes.js` mounting `POST /` → `protect`, `postAssign`
  - Mount at `/api/assign` in `backend/src/index.js`
  - _Requirements: 14.1, 14.7, 14.11_

- [ ] 35. Final checkpoint — verify assignment feature
  - Verify all new files exist and index.js mounts the assign route

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Properties 5–8 are defined in the design document's Correctness Properties section
- Use Jest + fast-check for backend property and unit tests
- Use pytest for ML service integration tests
- The `protect` middleware can be imported and applied to any future route that requires authentication
