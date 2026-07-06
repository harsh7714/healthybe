const express = require('express')
const multer = require('multer')
const Profile = require('../models/Profile')
const getUserId = require('../utils/getUserId')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPEG, PNG or WEBP allowed.'))
  },
})

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
        { userId, id: "self", name: userName, relation: "Self (Primary)", age: "24 Yrs", email: userEmail, initials: userInitials }
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

module.exports = router
