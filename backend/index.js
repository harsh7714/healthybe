require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const apiRouter = require('./routes/api')

const app = express()
const PORT = process.env.PORT || 3001

const path = require('path')
const requestLogger = require('./middleware/requestLogger')
const { apiLimiter } = require('./middleware/rateLimiter')
const errorHandler = require('./middleware/errorHandler')
const AppError = require('./utils/AppError')

/* ─── Middleware ───────────────────────────────────────────────── */
app.use(cors())
app.use(requestLogger)
app.use(apiLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/* ─── Database ─────────────────────────────────────────────────── */
connectDB()

/* ─── Routes ───────────────────────────────────────────────────── */
app.use(apiRouter)

/* ─── 404 Handler for Undefined Routes ─────────────────────────── */
app.all('*', (req, _res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404))
})

/* ─── Global error handler ─────────────────────────────────────── */
app.use(errorHandler)

/* ─── Start ────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  HealthyBe API  →  http://localhost:${PORT}`)
  console.log(`   /health               GET  – server + DB status`)
  console.log(`   /api/reports          GET  – all reports from MongoDB`)
  console.log(`   /api/upload           POST – upload → S3 → Gemini → MongoDB`)
  console.log(`   /api/reports/:id      DELETE – remove from MongoDB + S3\n`)

  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME', 'GEMINI_API_KEY', 'MONGODB_URI']
  const missing = required.filter(k => !process.env[k])
  if (missing.length) {
    console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`)
    console.warn('   Fill them in backend/.env\n')
  }
})
