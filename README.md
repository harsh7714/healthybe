# HealthyBe

**Version:** 1.1.0

HealthyBe is a family health management app. The frontend uses React and Vite. The backend is an Express API backed by MongoDB and Mongoose, with optional S3 report storage, Gemini chat, and SMTP password recovery.

## Project structure

- [frontend/](./frontend/) contains the React + Vite client.
- [backend/](./backend/) contains the Express API and its MVC/service layers.
- [docs/architecture.md](./docs/architecture.md) describes the code organization and how to add features.

The frontend groups pages, components, hooks, and endpoint functions by feature. The backend separates route mapping, controllers, services, models, middleware, and configuration.

## Local setup

You need Node.js with npm and a running MongoDB instance. The default MongoDB URI is mongodb://localhost:27017/healthybe.

1. Create local environment files from the examples:

   PowerShell:

   > Copy-Item backend/.env.example backend/.env
   >
   > Copy-Item frontend/.env.example frontend/.env

2. Set MONGODB_URI in backend/.env if MongoDB is not running at the default URI. The examples list all supported keys with empty values; fill credentials only for integrations you use.

3. Install dependencies from each app folder:

   > cd backend
   >
   > npm install
   >
   > cd ../frontend
   >
   > npm install

4. Start MongoDB, then start the backend from backend/:

   > npm run dev

   The API listens on port 3001 by default. Check http://localhost:3001/health for server and database status.

5. In a second terminal, start the frontend from frontend/:

   > npm run dev

   Open http://localhost:5173.

## Environment configuration

Backend settings are read from backend/.env. MONGODB_URI, PORT, NODE_ENV, and FRONTEND_ORIGIN have development defaults. AWS report storage is enabled only when AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_BUCKET_NAME are all set; otherwise uploads use backend/uploads/ for local development. GEMINI_API_KEY enables chat. Password recovery requires SMTP_HOST, SMTP_USER, and SMTP_PASS; set SMTP_PORT to 587 (or your provider's port) when configuring SMTP. SMTP_FROM is optional.

Frontend settings are read from frontend/.env. VITE_API_BASE_URL defaults to /api/v1. VITE_API_PROXY_TARGET defaults to http://localhost:3001 for the Vite development proxy. For a deployed API, set VITE_API_BASE_URL to its API base URL.

New requests use /api/v1. The previous /api routes remain available as a compatibility alias. The frontend proxy forwards /api and /health to the backend during development.

## Useful commands

Run these from the relevant app folder:

- Backend: npm run dev, npm start, npm run lint, npm run format:check
- Frontend: npm run dev, npm run build, npm run lint, npm run format:check

Run npm run format in either app to apply Prettier formatting.

## Privacy and report storage

- Session identifiers are stored hashed in MongoDB and delivered through an HttpOnly cookie.
- Report files are private. Uploading a file does not trigger Gemini analysis; files are sent to Gemini only when a user explicitly asks a chat question about them.
- S3 is used when fully configured. Otherwise, local development files are saved under backend/uploads/.
- Set FRONTEND_ORIGIN to the deployed frontend origin when deploying the API.

## Clear database and S3 report data

The cleanup script permanently deletes every collection in the configured MongoDB database and all object versions and delete markers in the configured S3 bucket. It keeps the S3 bucket, other AWS resources, and local files under backend/uploads/.

From backend/, run the script with the exact database and bucket names configured in backend/.env:

> node scripts/clearDb.js --confirm=database-name:bucket-name

Replace database-name:bucket-name with the exact names from the environment. The script prints the required confirmation value if they do not match, and displays the database document count and S3 version count before deletion. MongoDB and AWS credentials need database drop and S3 list/delete version permissions. This operation cannot be undone.
