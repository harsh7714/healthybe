const express = require('express')
const Profile = require('../models/Profile')
const Report = require('../models/Report')
const requireAuth = require('../middleware/requireAuth')
const { removeReport } = require('../services/reportStorage')

const router = express.Router()
router.use('/api/profiles', requireAuth)
const owner = req => String(req.user._id)
const shape = doc => ({ id: doc.id, name: doc.name, relation: doc.relation, age: doc.age || '', email: doc.email || '', initials: doc.initials || doc.name.slice(0, 1).toUpperCase(), profileImageUrl: doc.profileImageUrl })

router.get('/api/profiles', async (req, res, next) => {
  try {
    let profiles = await Profile.find({ userId: owner(req) }).sort({ createdAt: 1 })
    if (!profiles.some(profile => profile.id === 'self')) {
      profiles.unshift(await Profile.create({ userId: owner(req), id: 'self', name: req.user.name, relation: 'Self', initials: req.user.name.slice(0, 2).toUpperCase() }))
    }
    res.json(profiles.map(shape))
  } catch (error) { next(error) }
})
router.post('/api/profiles', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const relation = String(req.body.relation || '').trim()
    if (!name || name.length > 80 || !relation || relation.length > 40) return res.status(400).json({ message: 'Enter a valid name and relationship.' })
    const id = require('crypto').randomUUID()
    const profile = await Profile.create({ userId: owner(req), id, name, relation, age: req.body.age ? String(req.body.age) : '', initials: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() })
    res.status(201).json(shape(profile))
  } catch (error) { next(error) }
})
router.patch('/api/profiles/:id', async (req, res, next) => {
  try {
    const updates = {}
    for (const key of ['name', 'relation', 'age']) if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim()
    if (updates.name) updates.initials = updates.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
    if (req.params.id === 'self' && updates.name) await require('../models/User').updateOne({ _id: req.user._id }, { name: updates.name })
    const profile = await Profile.findOneAndUpdate({ userId: owner(req), id: req.params.id }, updates, { new: true, runValidators: true })
    if (!profile) return res.status(404).json({ message: 'Profile not found.' })
    res.json(shape(profile))
  } catch (error) { next(error) }
})
router.delete('/api/profiles/:id', async (req, res, next) => {
  try {
    if (req.params.id === 'self') return res.status(400).json({ message: 'The account owner profile cannot be removed.' })
    const profile = await Profile.findOne({ userId: owner(req), id: req.params.id })
    if (!profile) return res.status(404).json({ message: 'Profile not found.' })
    const reports = await Report.find({ userId: owner(req), profileId: req.params.id })
    await Promise.all(reports.map(removeReport))
    await profile.deleteOne()
    await Promise.all([
      Report.deleteMany({ userId: owner(req), profileId: req.params.id }),
      require('../models/ChatSession').deleteMany({ userId: owner(req), profileId: req.params.id }),
    ])
    res.json({ ok: true })
  } catch (error) { next(error) }
})
module.exports = router
