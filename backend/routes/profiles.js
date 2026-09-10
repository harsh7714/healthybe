const express = require('express')
const multer = require('multer')
const Profile = require('../models/Profile')
const getUserId = require('../utils/getUserId')
const AppError = require('../utils/AppError')
const asyncHandler = require('../middleware/asyncHandler')
const { validateCreateProfile } = require('../middleware/validator')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new AppError('Only PDF, JPEG, PNG or WEBP allowed.', 400))
  },
})

// GET /api/profiles
router.get('/api/profiles', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const docs = await Profile.find({ userId }).sort({ createdAt: 1 })

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
}))

// POST /api/profiles
router.post('/api/profiles', validateCreateProfile, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { name, relation, age, email } = req.body

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
    name: name.trim(),
    relation: relation.trim(),
    age: age ? `${age} Yrs` : '',
    email: email || 'shared-email@example.com',
    initials
  })

  res.status(201).json(doc)
}))

// PUT /api/profiles/:id
router.put('/api/profiles/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { name, relation, age, email } = req.body
  const updates = {}
  if (name) {
    updates.name = name.trim()
    const getInitials = (str) => {
      const parts = str.trim().split(' ')
      if (parts.length > 1) return parts[0][0] + parts[1][0]
      return parts[0].slice(0, 2).toUpperCase()
    }
    updates.initials = getInitials(name)
  }
  if (relation) updates.relation = relation.trim()
  if (age !== undefined) {
    updates.age = age.includes('Yrs') ? age : `${age} Yrs`
  }
  if (email) updates.email = email.trim()

  const doc = await Profile.findOneAndUpdate({ userId, id: req.params.id }, updates, { new: true })
  if (!doc) throw new AppError('Profile not found.', 404)

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
}))

// DELETE /api/profiles/:id
router.delete('/api/profiles/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const doc = await Profile.findOneAndDelete({ userId, id: req.params.id })
  if (!doc) throw new AppError('Profile not found.', 404)

  res.json({ ok: true })
}))

// POST /api/profiles/:id/image
// Stores the uploaded image directly in MongoDB as a Base64 string
router.post('/api/profiles/:id/image', upload.single('image'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { file } = req
  if (!file) throw new AppError('No image file uploaded.', 400)

  const doc = await Profile.findOne({ userId, id: req.params.id })
  if (!doc) throw new AppError('Profile not found.', 404)

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
}))

module.exports = router
