require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const apiRouter = require('./routes')

const app = express()
const PORT = process.env.PORT || 3001

// Trust reverse proxies (Render, Railway, AWS ALB, Heroku)
app.set('trust proxy', 1)

const requestLogger = require('./middleware/requestLogger')
const { apiLimiter } = require('./middleware/rateLimiter')
const errorHandler = require('./middleware/errorHandler')
const AppError = require('./utils/AppError')
const mongoose = require('mongoose')

/* ─── Health / Root Endpoints (Deployment & Load Balancers) ─────── */
// Handle HEAD and GET for / and /health to satisfy cloud deployment probes
app.route('/')
  .get((_req, res) => {
    res.status(200).json({ status: 'ok', service: 'HealthyBe API', version: '1.1.0' })
  })
  .head((_req, res) => {
    res.status(200).end()
  })

app.route('/health')
  .get((_req, res) => {
    res.status(200).json({
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    })
  })
  .head((_req, res) => {
    res.status(200).end()
  })

/* ─── Middleware ───────────────────────────────────────────────── */
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }))
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') && req.get('origin') !== allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }
  next()
})
app.use(requestLogger)
app.use(apiLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

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
