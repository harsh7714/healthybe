const express = require('express')
const Profile = require('../models/Profile')
const Report = require('../models/Report')
const requireAuth = require('../src/middleware/auth.middleware')
const { readReport } = require('../services/reportStorage')
const { answerHealthQuestion } = require('../services/healthChat')
const { aiChatLimiter } = require('../src/middleware/rateLimit.middleware')
const { memoryUpload } = require('../src/middleware/upload.middleware')
const isAllowedReportFile = require('../src/utils/isAllowedReportFile')

const router = express.Router()
router.post('/api/chat', aiChatLimiter, requireAuth, memoryUpload.single('file'), async (req, res, next) => {
  try {
    const profileId = String(req.body.profileId || '')
    const profile = await Profile.findOne({ userId: String(req.user._id), id: profileId })
    if (!profile) return res.status(404).json({ message: 'Selected family profile was not found.' })
    const text = String(req.body.message || '').trim()
    if (!text && !req.file && !req.body.reportId) return res.status(400).json({ message: 'Write a question or attach a report.' })
    if (req.file && !isAllowedReportFile(req.file)) return res.status(400).json({ message: 'The attachment content does not match its PDF or image type.' })
    let attachment = null
    if (req.body.reportId) {
      const report = await Report.findOne({ _id: req.body.reportId, userId: String(req.user._id), profileId })
      if (!report) return res.status(404).json({ message: 'Report not found for this profile.' })
      const buffer = await readReport(report)
      attachment = { data: buffer.toString('base64'), mimeType: report.mimeType }
    } else if (req.file) attachment = { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype }
    let history
    try { history = JSON.parse(String(req.body.history || '[]')) }
    catch { return res.status(400).json({ message: 'Conversation history is invalid.' }) }
    if (!Array.isArray(history) || history.length > 40) return res.status(400).json({ message: 'Conversation history is invalid.' })
    const answer = await answerHealthQuestion({ prompt: text, profile, history, attachment })
    res.json({ answer })
  } catch (error) { next(error) }
})
module.exports = router
