const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const Report = require('../models/Report')
const Profile = require('../models/Profile')
const { presign, uploadToS3, deleteFromS3 } = require('../services/s3Service')
const { analyzeWithGemini } = require('../services/geminiService')
const { mergeAnalysisIntoProfileHealthData } = require('../services/profileService')
const getUserId = require('../utils/getUserId')

const router = express.Router()

/* ─── Multer ───────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPEG, PNG or WEBP allowed.'))
  },
})

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Health check
router.get('/health', async (_req, res) => {
  const mongoose = require('mongoose')
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

/* GET /api/reports
   Returns reports belonging to the user from MongoDB with fresh S3 presigned URLs
   Optimized to NOT return massive raw Base64 data strings for files in list response */
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
        if (s3Url && s3Url.startsWith('data:')) {
          // Replace base64 string with reference path to download endpoint
          s3Url = `/api/reports/${doc._id}/file`
        } else if (doc.s3Key && (!s3Url || !s3Url.startsWith('data:'))) {
          // Try presigning S3 key, if fails fallback to download endpoint
          try { 
            s3Url = await presign(doc.s3Key) 
          } catch (_) {
            s3Url = `/api/reports/${doc._id}/file`
          }
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
   1. Upload file to S3 (or fallback to local disk, or fallback to MongoDB Base64)
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

    let s3Url = null

    // 1 — Try uploading to AWS S3 if credentials are set
    const s3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME
    if (s3Configured) {
      try {
        await uploadToS3(fileKey, file.buffer, file.mimetype)
        s3Url = await presign(fileKey)
        console.log(`🚀 File uploaded to S3: ${fileKey}`)
      } catch (s3Err) {
        console.warn(`⚠️ S3 upload failed, falling back to local disk: ${s3Err.message}`)
      }
    }

    // 2 — Fallback: write to local disk
    if (!s3Url) {
      try {
        const fileName = `${timestamp}_${safeName}`
        const filePath = path.join(uploadsDir, fileName)
        fs.writeFileSync(filePath, file.buffer)
        s3Url = `/uploads/${fileName}`
        console.log(`💾 File saved to local disk: ${filePath}`)
      } catch (diskErr) {
        console.warn(`⚠️ Local disk write failed, falling back to MongoDB Base64: ${diskErr.message}`)
      }
    }

    // 3 — Last fallback: store directly in MongoDB as Base64 data URI
    if (!s3Url) {
      const base64Data = file.buffer.toString('base64')
      s3Url = `data:${file.mimetype};base64,${base64Data}`
      console.log(`💾 Fallback: Storing report in MongoDB directly as Base64 data URI`)
    }

    // Gemini AI analysis
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

    // Save metadata/file reference to MongoDB
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

    // Aggregate and update Profile dashboard info
    await mergeAnalysisIntoProfileHealthData(userId, profileId, analysis, file.originalname, doc.date)

    // Make sure we return a lightweight path instead of huge base64 in response to client
    let clientS3Url = s3Url
    if (clientS3Url && clientS3Url.startsWith('data:')) {
      clientS3Url = `/api/reports/${doc._id}/file`
    }

    res.json({
      id:       doc._id,
      name:     doc.name,
      profileId: doc.profileId,
      s3Key:    fileKey,
      s3Url:    clientS3Url,
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

/* GET /api/reports/:id/file
   Serves the uploaded file directly as a binary response for inline viewing (prevents blocking data URIs in iframes) */
router.get('/api/reports/:id/file', async (req, res) => {
  try {
    const userId = getUserId(req)
    const report = await Report.findOne({ _id: req.params.id, userId })
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' })
    }

    if (report.s3Url && report.s3Url.startsWith('data:')) {
      const matches = report.s3Url.match(/^data:([a-zA-Z0-9.+\/-]+);base64,(.+)$/)
      if (!matches) {
        return res.status(400).json({ error: 'Invalid file data format.' })
      }
      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', 'inline')
      return res.send(buffer)
    } else if (report.s3Url) {
      if (report.s3Url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', report.s3Url)
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Disposition', 'inline')
          return res.sendFile(filePath)
        }
      }
      return res.redirect(report.s3Url)
    } else {
      return res.status(404).json({ error: 'File content not found.' })
    }
  } catch (err) {
    console.error('File serving error:', err.message)
    res.status(500).json({ error: err.message || 'Error retrieving file.' })
  }
})

/* DELETE /api/reports/:id
   Removes from MongoDB, deletes from S3 or local uploads folder, and updates profile dashboard info */
router.delete('/api/reports/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const doc = await Report.findOneAndDelete({ userId, _id: req.params.id })
    if (!doc) return res.status(404).json({ error: 'Report not found.' })

    // Delete file from S3 or local disk uploads folder
    if (doc.s3Url && doc.s3Url.includes('/uploads/')) {
      try {
        const fileNameOnDisk = doc.s3Url.split('/uploads/')[1]
        const filePath = path.join(uploadsDir, fileNameOnDisk)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Local file deleted: ${filePath}`)
        }
      } catch (fsErr) {
        console.warn('Local file delete failed (non-fatal):', fsErr.message)
      }
    } else if (doc.s3Key && (!doc.s3Url || !doc.s3Url.startsWith('data:'))) {
      try {
        await deleteFromS3(doc.s3Key)
        console.log(`🗑️ S3 deleted: ${doc.s3Key}`)
      } catch (s3Err) {
        console.warn('S3 delete failed (non-fatal):', s3Err.message)
      }
    }

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

module.exports = router
