const Profile = require('../models/profile.model')
const Report = require('../models/report.model')
const AppError = require('../utils/AppError')
const isAllowedReportFile = require('../utils/isAllowedReportFile')
const { readReport } = require('../../services/reportStorage')
const { answerHealthQuestion } = require('../../services/healthChat')
const chatValidator = require('../validators/chat.validator')

async function sendMessage(user, data, file) {
  const userId = String(user._id)
  const profileId = String(data.profileId || '')
  const profile = await Profile.findOne({ userId, id: profileId })
  if (!profile) throw messageError('Selected family profile was not found.', 404)

  const text = String(data.message || '').trim()
  chatValidator.validateQuestion(text, file, data.reportId)
  if (file && !isAllowedReportFile(file)) {
    throw messageError('The attachment content does not match its PDF or image type.', 400)
  }

  let attachment = null
  if (data.reportId) {
    const report = await Report.findOne({ _id: data.reportId, userId, profileId })
    if (!report) throw messageError('Report not found for this profile.', 404)
    const buffer = await readReport(report)
    attachment = { data: buffer.toString('base64'), mimeType: report.mimeType }
  } else if (file) {
    attachment = { data: file.buffer.toString('base64'), mimeType: file.mimetype }
  }

  const history = chatValidator.parseHistory(data.history)
  return { answer: await answerHealthQuestion({ prompt: text, profile, history, attachment }) }
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}

module.exports = { sendMessage }
