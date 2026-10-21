const express = require('express')
const crypto = require('crypto')
const path = require('path')
const Report = require('../src/models/report.model')
const Profile = require('../src/models/profile.model')
const requireAuth = require('../src/middleware/auth.middleware')
const { saveReport, readReport, removeReport, hasS3 } = require('../services/reportStorage')
const { uploadLimiter } = require('../src/middleware/rateLimit.middleware')
const { memoryUpload } = require('../src/middleware/upload.middleware')
const isAllowedReportFile = require('../src/utils/isAllowedReportFile')

const router = express.Router()
router.use('/api/reports', requireAuth)
router.post('/api/upload', uploadLimiter, requireAuth, memoryUpload.single('file'), async (req, res, next) => {
  try {
    const file = req.file
    const profileId = String(req.body.profileId || '')
    if (!file) return res.status(400).json({ message: 'Choose a file to upload.' })
    if (!isAllowedReportFile(file)) return res.status(400).json({ message: 'The file content does not match its PDF or image type.' })
    if (!await Profile.exists({ userId: String(req.user._id), id: profileId })) return res.status(404).json({ message: 'Selected family profile was not found.' })
    const safeName = path.basename(file.originalname).replace(/[\\/:*?"<>|]/g, '_').slice(0, 160)
    const stored = await saveReport(`${req.user._id}/${profileId}/${crypto.randomUUID()}${path.extname(safeName)}`, file.buffer, file.mimetype)
    let report
    try {
      report = await Report.create({ userId: String(req.user._id), profileId, name: safeName || 'Health report', s3Key: stored.key, s3Url: stored.storage === 'local' ? 'local' : null, mimeType: file.mimetype, size: String(file.size), type: file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE', status: 'COMPLETED', date: new Date().toISOString() })
    } catch (error) { await removeReport({ s3Key: stored.key, s3Url: stored.storage === 'local' ? 'local' : null }); throw error }
    res.status(201).json(shape(report))
  } catch (error) { next(error) }
})
router.get('/api/reports', async (req, res, next) => {
  try {
    const filter = { userId: String(req.user._id) }
    if (req.query.profileId && req.query.profileId !== 'all') filter.profileId = String(req.query.profileId)
    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean()
    res.json(reports.map(shape))
  } catch (error) { next(error) }
})
router.patch('/api/reports/:id', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name || name.length > 160) return res.status(400).json({ message: 'File name must be 1–160 characters.' })
    const report = await Report.findOneAndUpdate({ _id: req.params.id, userId: String(req.user._id) }, { name }, { new: true })
    if (!report) return res.status(404).json({ message: 'Report not found.' })
    res.json(shape(report))
  } catch (error) { next(error) }
})
router.get('/api/reports/:id/file', async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: String(req.user._id) })
    if (!report) return res.status(404).json({ message: 'Report not found.' })
    const buffer = await readReport(report)
    res.type(report.mimeType || 'application/octet-stream').set({ 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(report.name)}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
  } catch (error) { next(error) }
})
router.delete('/api/reports/:id', async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: String(req.user._id) })
    if (!report) return res.status(404).json({ message: 'Report not found.' })
    await removeReport(report)
    await report.deleteOne()
    res.json({ ok: true })
  } catch (error) { next(error) }
})
function shape(report) {
  return { id: String(report._id), name: report.name, profileId: report.profileId, mimeType: report.mimeType, size: Number(report.size) || 0, type: report.type, status: 'COMPLETED', date: report.date || report.createdAt, fileUrl: `/api/reports/${report._id}/file`, storage: report.s3Url === 'local' ? 'local' : (hasS3() ? 'cloud' : 'local') }
}
module.exports = router
