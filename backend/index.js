require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const apiRouter = require('./routes/api')

const app = express()
const PORT = process.env.PORT || 3001

const path = require('path')

/* ─── Middleware ───────────────────────────────────────────────── */
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/* ─── Database ─────────────────────────────────────────────────── */
connectDB()

/* ─── Routes ───────────────────────────────────────────────────── */
app.use(apiRouter)

/* ─── Global error handler ─────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message)
  res.status(err.status || 500).json({ error: err.message })
})

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
