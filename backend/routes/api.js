const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const Report = require('../models/Report')
const Profile = require('../models/Profile')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const { presign, uploadToS3, deleteFromS3 } = require('../services/s3Service')
const { analyzeWithGemini, chatWithGemini } = require('../services/geminiService')

const router = express.Router()

/* ─── Helpers ──────────────────────────────────────────────────── */
const getUserId = (req) => {
  return req.headers['x-user-email'] || req.query.userId || req.body.userId || 'self'
}

const compileProfileHealthData = async (userId, profileId) => {
  try {
    const reports = await Report.find({ userId, profileId }).sort({ createdAt: -1 })
    
    // 1. Compile Vitals (latest non-empty vitals)
    let vitals = {}
    const reportWithVitals = reports.find(r => {
      const data = r.analysis
      return data && data.vitals && Object.keys(data.vitals).length > 0
    })
    if (reportWithVitals) {
      vitals = reportWithVitals.analysis.vitals
    }

    // 2. Compile Lab Metrics (latest value for each metric name)
    const latestMetrics = {}
    reports.forEach(r => {
      const data = r.analysis
      if (data && data.metrics) {
        data.metrics.forEach(m => {
          if (m && m.name && !latestMetrics[m.name]) {
            latestMetrics[m.name] = {
              ...m,
              date: r.date,
              fileName: r.name,
              memberId: r.profileId
            }
          }
        })
      }
    })
    const metricsList = Object.values(latestMetrics)

    // 3. Compile Medications List
    const medications = []
    const seenMedications = new Set()
    reports.forEach(r => {
      const data = r.analysis
      if (data && data.medications) {
        data.medications.forEach(m => {
          if (m && m.name) {
            const keyMed = m.name.toLowerCase()
            if (!seenMedications.has(keyMed)) {
              seenMedications.add(keyMed)
              medications.push({
                ...m,
                source: r.name,
                date: r.date
              })
            }
          }
        })
      }
    })

    // 4. Compile Checkups List
    const checkups = []
    reports.forEach(r => {
      const data = r.analysis
      if (data && data.checkup && data.checkup.type) {
        checkups.push({
          date: r.date,
          type: data.checkup.type,
          findings: data.checkup.findings || '',
          fileName: r.name
        })
      }
    })

    // 5. Compile Diet Guidelines
    const dietGuidelines = []
    const seenDiets = new Set()
    reports.forEach(r => {
      const data = r.analysis
      if (data && data.diet) {
        data.diet.forEach(d => {
          if (d && !seenDiets.has(d.toLowerCase())) {
            seenDiets.add(d.toLowerCase())
            dietGuidelines.push({ text: d, profileId: r.profileId })
          }
        })
      }
    })

    const healthData = { vitals, metrics: metricsList, medications, checkups, diet: dietGuidelines }

    await Profile.findOneAndUpdate(
      { userId, id: profileId },
      { healthData },
      { new: true }
    )
  } catch (err) {
    console.error(`Error compiling profile health data for ${userId}/${profileId}:`, err.message)
  }
}

/* ─── Multer ───────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPEG, PNG or WEBP allowed.'))
  },
})

/* ─── Routes ───────────────────────────────────────────────────── */

// Health check
router.get('/health', async (_req, res) => {
  const mongoose = require('mongoose')
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

/* ─── Auth Routes ──────────────────────────────────────────────── */

// Register a new user and pre-create family profiles
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password, age } = req.body
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, Name, and Password are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const trimName = name.trim()

    // Check if user already exists
    let user = await User.findOne({ email: trimEmail })
    if (user) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in instead.' })
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    user = await User.create({ email: trimEmail, name: trimName, password: hashedPassword })

    // Pre-create the default family profiles
    const rawName = trimEmail.split('@')[0]
    const userName = trimName || rawName.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    const userInitials = userName.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)

    const formattedAge = age ? `${age} Yrs` : "24 Yrs"

    const defaultProfiles = [
      { userId: trimEmail, id: "self", name: userName, relation: "Self (Primary)", age: formattedAge, email: trimEmail, initials: userInitials },
      { userId: trimEmail, id: "father", name: "Ramesh Gupta", relation: "Father", age: "56 Yrs", email: "shared-email@example.com", initials: "RG" },
      { userId: trimEmail, id: "mother", name: "Sunita Gupta", relation: "Mother", age: "51 Yrs", email: "shared-email@example.com", initials: "SG" }
    ]
    
    // Check if profiles already exist for this email to prevent duplicate keys
    const existingProfilesCount = await Profile.countDocuments({ userId: trimEmail })
    if (existingProfilesCount === 0) {
      await Profile.create(defaultProfiles)
    }

    res.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (err) {
    console.error('Registration error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Sign in checking if email and password match
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: trimEmail })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Make sure profiles exist for this user in case they were deleted or not created
    const existingProfilesCount = await Profile.countDocuments({ userId: trimEmail })
    if (existingProfilesCount === 0) {
      const rawName = trimEmail.split('@')[0]
      const userName = user.name || rawName.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      const userInitials = userName.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)
      const defaultProfiles = [
        { userId: trimEmail, id: "self", name: userName, relation: "Self (Primary)", age: "24 Yrs", email: trimEmail, initials: userInitials },
        { userId: trimEmail, id: "father", name: "Ramesh Gupta", relation: "Father", age: "56 Yrs", email: "shared-email@example.com", initials: "RG" },
        { userId: trimEmail, id: "mother", name: "Sunita Gupta", relation: "Mother", age: "51 Yrs", email: "shared-email@example.com", initials: "SG" }
      ]
      await Profile.create(defaultProfiles)
    }

    res.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* GET /api/reports
   Returns reports belonging to the user from MongoDB with fresh S3 presigned URLs */
router.get('/api/reports', async (req, res) => {
  try {
    const userId = getUserId(req)
    const filter = req.query.profileId && req.query.profileId !== 'all'
      ? { userId, profileId: req.query.profileId }
      : { userId }

    const docs = await Report.find(filter).sort({ createdAt: -1 })

    const reports = await Promise.all(
      docs.map(async doc => {
        let s3Url = doc.s3Url
        if (doc.s3Key && (!s3Url || !s3Url.startsWith('data:'))) {
          try { s3Url = await presign(doc.s3Key) } catch (_) {}
        }
        return {
          id:        doc._id,
          name:      doc.name,
          profileId: doc.profileId,
          s3Key:     doc.s3Key,
          s3Url,
          mimeType:  doc.mimeType,
          size:      doc.size,
          type:      doc.type,
          analysis:  doc.analysis,
          date:      doc.date,
        }
      })
    )

    res.json(reports)
  } catch (err) {
    console.error('GET /api/reports error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* POST /api/upload
   1. Upload file to S3 (or fallback to local disk)
   2. Run Gemini AI analysis
   3. Save metadata to MongoDB
   4. Aggregate and update Profile dashboard info
   5. Return the saved report */
router.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = getUserId(req)
    const { file } = req
    const profileId = req.body.profileId || 'self'

    if (!file) return res.status(400).json({ error: 'No file received.' })

    // Build file key / unique name
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileKey = `healthybe/${profileId}/${timestamp}_${safeName}`

    // 1 — Upload to S3 (or write to local disk fallback)
    let s3Url = ''
    if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.includes('your_')) {
      const uploadDir = path.join(__dirname, '..', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const fileNameOnDisk = `${timestamp}_${safeName}`
      const filePath = path.join(uploadDir, fileNameOnDisk)
      fs.writeFileSync(filePath, file.buffer)
      
      const PORT = process.env.PORT || 3001
      const reqHost = req.get('host') || `localhost:${PORT}`
      s3Url = `${req.protocol}://${reqHost}/uploads/${fileNameOnDisk}`
      console.log(`⚠️ AWS S3 not configured. Saved report '${file.originalname}' locally: ${s3Url}`)
    } else {
      await uploadToS3(fileKey, file.buffer, file.mimetype, { profileId, originalName: file.originalname })
      console.log(`✅ S3 upload: ${fileKey}`)
      s3Url = await presign(fileKey)
    }

    // 2 — Gemini AI analysis
    let analysis = null
    try {
      analysis = await analyzeWithGemini(file.buffer, file.mimetype)
      console.log(`🤖 Gemini OK: ${file.originalname}`)
    } catch (aiErr) {
      console.warn(`⚠️  Gemini failed (non-fatal): ${aiErr.message}`)
      analysis = {
        vitals: {},
        metrics: [],
        checkup: { type: 'Uploaded Document', findings: 'AI analysis unavailable for this document.' },
        medications: [],
        diet: [],
      }
    }

    // 3 — Save to MongoDB (Metadata only, file content is on S3/Disk)
    const doc = await Report.create({
      userId,
      name:      file.originalname,
      profileId,
      s3Key:     fileKey,
      s3Url,
      mimeType:  file.mimetype,
      size:      `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type:      file.mimetype.includes('image') ? 'IMAGE' : 'PDF',
      analysis,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
    })

    console.log(`💾 MongoDB saved: ${doc._id}`)

    // 4 — Aggregate and update Profile dashboard info
    await compileProfileHealthData(userId, profileId)

    res.json({
      id:       doc._id,
      name:     doc.name,
      profileId: doc.profileId,
      s3Key:    fileKey,
      s3Url,
      mimeType: file.mimetype,
      size:     doc.size,
      type:     doc.type,
      analysis,
      date:     doc.date,
    })
  } catch (err) {
    console.error('Upload error:', err.message)
    res.status(500).json({ error: err.message || 'Upload failed.' })
  }
})

/* DELETE /api/reports/:id
   Removes from MongoDB, deletes from S3 or local uploads folder, and updates profile dashboard info */
router.delete('/api/reports/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const doc = await Report.findOneAndDelete({ userId, _id: req.params.id })
    if (!doc) return res.status(404).json({ error: 'Report not found.' })

    // 1 — Delete file from S3 or local disk uploads folder
    if (doc.s3Url && doc.s3Url.includes('/uploads/')) {
      try {
        const fileNameOnDisk = doc.s3Url.split('/uploads/')[1]
        const filePath = path.join(__dirname, '..', 'uploads', fileNameOnDisk)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Local file deleted: ${filePath}`)
        }
      } catch (fsErr) {
        console.warn('Local file delete failed (non-fatal):', fsErr.message)
      }
    } else if (doc.s3Key) {
      try {
        await deleteFromS3(doc.s3Key)
        console.log(`🗑️ S3 deleted: ${doc.s3Key}`)
      } catch (s3Err) {
        console.warn('S3 delete failed (non-fatal):', s3Err.message)
      }
    }

    // 2 — Re-aggregate and update Profile dashboard info
    await compileProfileHealthData(userId, doc.profileId)

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* GET /api/presign/:key — Fresh 1-hour presigned URL for any key */
router.get('/api/presign/*', async (req, res) => {
  try {
    const url = await presign(req.params[0], 3600)
    res.json({ url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ─── Profile Routes ──────────────────────────────────────────────── */

// GET /api/profiles
router.get('/api/profiles', async (req, res) => {
  try {
    const userId = getUserId(req)
    let docs = await Profile.find({ userId }).sort({ createdAt: 1 })
    if (docs.length === 0) {
      // Parse profile details from user Email
      const userEmail = userId.includes('@') ? userId : 'shared-email@example.com'
      const rawName = userId.includes('@') ? userId.split('@')[0] : 'Harsh Gupta'
      const userName = rawName.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      const userInitials = userName.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)

      const defaultProfiles = [
        { userId, id: "self", name: userName, relation: "Self (Primary)", age: "24 Yrs", email: userEmail, initials: userInitials },
        { userId, id: "father", name: "Ramesh Gupta", relation: "Father", age: "56 Yrs", email: "shared-email@example.com", initials: "RG" },
        { userId, id: "mother", name: "Sunita Gupta", relation: "Mother", age: "51 Yrs", email: "shared-email@example.com", initials: "SG" }
      ]
      docs = await Profile.create(defaultProfiles)
    }

    const profiles = docs.map(doc => ({
      id: doc.id,
      name: doc.name,
      relation: doc.relation,
      age: doc.age,
      email: doc.email,
      initials: doc.initials,
      profileImageUrl: doc.profileImageUrl,
      healthData: doc.healthData
    }))

    res.json(profiles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/profiles
router.post('/api/profiles', async (req, res) => {
  try {
    const userId = getUserId(req)
    const { name, relation, age, email } = req.body
    if (!name || !relation) {
      return res.status(400).json({ error: 'Name and relation are required.' })
    }

    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000)
    const getInitials = (str) => {
      const parts = str.trim().split(' ')
      if (parts.length > 1) return parts[0][0] + parts[1][0]
      return parts[0].slice(0, 2).toUpperCase()
    }
    const initials = getInitials(name)

    const doc = await Profile.create({
      userId,
      id,
      name,
      relation,
      age: age ? `${age} Yrs` : '',
      email: email || 'shared-email@example.com',
      initials
    })

    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/profiles/:id
router.put('/api/profiles/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const { name, relation, age, email } = req.body
    const updates = {}
    if (name) {
      updates.name = name
      const getInitials = (str) => {
        const parts = str.trim().split(' ')
        if (parts.length > 1) return parts[0][0] + parts[1][0]
        return parts[0].slice(0, 2).toUpperCase()
      }
      updates.initials = getInitials(name)
    }
    if (relation) updates.relation = relation
    if (age !== undefined) {
      updates.age = age.includes('Yrs') ? age : `${age} Yrs`
    }
    if (email) updates.email = email

    const doc = await Profile.findOneAndUpdate({ userId, id: req.params.id }, updates, { new: true })
    if (!doc) return res.status(404).json({ error: 'Profile not found.' })

    res.json({
      id: doc.id,
      name: doc.name,
      relation: doc.relation,
      age: doc.age,
      email: doc.email,
      initials: doc.initials,
      profileImageUrl: doc.profileImageUrl,
      healthData: doc.healthData
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/profiles/:id
router.delete('/api/profiles/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const doc = await Profile.findOneAndDelete({ userId, id: req.params.id })
    if (!doc) return res.status(404).json({ error: 'Profile not found.' })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/profiles/:id/image
// Stores the uploaded image directly in MongoDB as a Base64 string
router.post('/api/profiles/:id/image', upload.single('image'), async (req, res) => {
  try {
    const userId = getUserId(req)
    const { file } = req
    if (!file) return res.status(400).json({ error: 'No image file uploaded.' })

    const doc = await Profile.findOne({ userId, id: req.params.id })
    if (!doc) return res.status(404).json({ error: 'Profile not found.' })

    // Convert file buffer directly to Base64 data URI
    const base64Data = file.buffer.toString('base64')
    const dataUri = `data:${file.mimetype};base64,${base64Data}`

    // Store directly in MongoDB
    doc.profileImageUrl = dataUri
    await doc.save()

    res.json({
      id: doc.id,
      name: doc.name,
      relation: doc.relation,
      age: doc.age,
      email: doc.email,
      initials: doc.initials,
      profileImageUrl: dataUri,
      healthData: doc.healthData
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* POST /api/chat
   Sends a user message + patient health context to Gemini 2.5 Flash
   and returns an AI-generated response */
router.post('/api/chat', async (req, res) => {
  try {
    const { message, context, language } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })

    const reply = await chatWithGemini(message, context || 'No patient health data available.', language || 'English')
    res.json({ reply })
  } catch (err) {
    console.error('POST /api/chat error:', err.message)
    res.status(500).json({ error: err.message || 'AI service unavailable' })
  }
})

module.exports = router
