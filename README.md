# HealthyBe - Family Health Management System

**Version**: `v1.1.0`

HealthyBe keeps each family member's report library separated under one account. The React/Vite frontend connects to an Express + MongoDB API; reports are stored in AWS S3 when configured, and are only sent to Gemini when a user explicitly asks a question about them in AI chat. Uploading a file does not trigger analysis or extraction.

---

## 🛠️ Project Structure

The frontend is organized by feature, with shared UI and API code kept separate. The backend follows Express layers.

```text
frontend/src/
├── app/                    # App state, routes and account guard
├── features/
│   ├── account/            # Authentication, profiles and settings
│   ├── chat/               # Health assistant
│   ├── home/               # Home screen
│   └── reports/            # Upload and report management
├── services/api/           # HTTP client plus auth/profile/report/chat APIs
├── shared/                 # Reusable components, layout and navigation data
├── index.css               # Global styles and responsive theme
└── main.jsx                # Frontend entry point

backend/
├── config/                 # Database setup
├── middleware/             # Authentication, rate limits and errors
├── models/                 # MongoDB models
├── routes/                 # API endpoint groups
├── services/               # Gemini, email and file storage
└── utils/                  # Shared helpers
```

- **[`frontend/`](./frontend)**: React + Vite client.
- **[`backend/`](./backend)**: Express API with MongoDB (Mongoose), private report storage, and Gemini chat.

---

## 🚀 Setup & Installation

### 1. Database (MongoDB)
Make sure you have MongoDB running locally, or prepare a MongoDB Atlas connection URI. By default, it expects:
`mongodb://localhost:27017/healthybe`

### 2. Configure Environment Variables
Configure `backend/.env` with `MONGODB_URI` and `GEMINI_API_KEY`. For cloud storage, also configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_BUCKET_NAME`. Password recovery needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`; `SMTP_FROM` is optional. Keep secrets private and never commit `.env`.

### 3. Install & Start the Backend
```bash
cd backend
npm install
npm run dev
```
The server will start on port `3001` (health check available at `http://localhost:3001/health`).

### 4. Install & Start the Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will spin up on port `5173`. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Features

## Account and privacy behavior

- Register or sign in with one email; family profiles and report ownership are scoped to that account.
- Random session identifiers are stored hashed in MongoDB and delivered in an HttpOnly cookie.
- Authenticated endpoints manage profiles, uploads, file renames, deletion, and AI chat. Report files are never served from a public URL.
- S3 is preferred when configured. Without S3 settings, files use the backend `uploads/` folder for local development. Configure S3 for durable cloud storage.
- Gemini runs only for explicit chat requests, including selected reports or camera/file attachments. Answers are health information, not diagnosis or a replacement for a clinician.
- Password recovery uses short-lived email codes. Account deletion requires the password and typing `DELETE`.

Set backend `FRONTEND_ORIGIN` when deploying. Optionally set frontend `VITE_API_PROXY_TARGET` for local proxying or `VITE_API_BASE_URL` when calling a deployed API directly.
