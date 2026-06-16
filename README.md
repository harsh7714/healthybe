# HealthyBe - Family Health Management System

A premium, modern family health record and dashboard application. It allows users to manage multiple family profiles, upload medical reports, convert camera-captured images automatically to PDF format, store records securely in AWS S3, query reports via an AI health consultation chat (powered by Google Gemini 1.5 Flash), and access emergency helplines.

---

## 🛠️ Project Structure

The project is structured into two separate workspaces:

- **[`frontend/`](./frontend)**: A React + Vite web application styled with premium custom HSL/CSS variables, containing user authentication guards, dashboard visualization, profile vault management, and camera capture controls.
- **[`backend/`](./backend)**: An Express server integrated with MongoDB (Mongoose), AWS S3 (`@aws-sdk/client-s3`), and Google Gemini AI.

---

## 🚀 Setup & Installation

### 1. Database (MongoDB)
Make sure you have MongoDB running locally, or prepare a MongoDB Atlas connection URI. By default, it expects:
`mongodb://localhost:27017/healthybe`

### 2. Configure Environment Variables
Copy the example environment template in the backend:
```bash
cp backend/.env.example backend/.env
```
Open **`backend/.env`** and populate the variables:
- `MONGODB_URI`: Connection string (local or Atlas)
- `AWS_ACCESS_KEY_ID`: Your AWS credential
- `AWS_SECRET_ACCESS_KEY`: Your AWS credential
- `AWS_REGION`: e.g. `ap-south-1`
- `AWS_BUCKET_NAME`: Target S3 bucket name
- `GEMINI_API_KEY`: Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey)

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

1. **Mobile-Locked Camera to PDF**: When tapping the camera FAB or scan buttons on a mobile device, pictures are converted client-side directly into clean, standardized A4 PDF files using `jsPDF` prior to upload.
2. **Secure S3 Storage**: All files are stored directly in AWS S3 and served securely using short-lived pre-signed URLs.
3. **Structured Gemini AI Extraction**: Google Gemini extracts lab metrics, vitals, active medications, checkup summaries, and diet suggestions from uploads, saving them in MongoDB.
4. **Global Auth Lockout**: Root-level route guards completely lock the application if logged out.
