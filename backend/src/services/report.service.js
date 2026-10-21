const crypto = require('crypto')
const path = require('path')

const Report = require('../models/report.model')
const Profile = require('../models/profile.model')
const AppError = require('../utils/AppError')
const isAllowedReportFile = require('../utils/isAllowedReportFile')
const storage = require('./storage')

function toReportResponse(report) {
  const id = String(report._id)
  return {
    id,
    name: report.name,
    profileId: report.profileId,
    mimeType: report.mimeType,
    size: Number(report.size) || 0,
    type: report.type,
    status: 'COMPLETED',
    date: report.date || report.createdAt,
    fileUrl: `/api/reports/${id}/file`,
    storage: storage.getStorageType(report),
  }
}

async function uploadReport(user, data, file) {
  const profileId = String(data.profileId || '')
  if (!file) throw messageError('Choose a file to upload.', 400)
  if (!isAllowedReportFile(file)) throw messageError('The file content does not match its PDF or image type.', 400)
  const userId = String(user._id)
  if (!await Profile.exists({ userId, id: profileId })) throw messageError('Selected family profile was not found.', 404)

  const safeName = path.basename(file.originalname).replace(/[\\/:*?"<>|]/g, '_').slice(0, 160)
  const stored = await storage.save(`${userId}/${profileId}/${crypto.randomUUID()}${path.extname(safeName)}`, file.buffer, file.mimetype)
  let report
  try {
    report = await Report.create({
      userId,
      profileId,
      name: safeName || 'Health report',
      s3Key: stored.key,
      s3Url: stored.storage === 'local' ? 'local' : null,
      mimeType: file.mimetype,
      size: String(file.size),
      type: file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE',
      status: 'COMPLETED',
      date: new Date().toISOString(),
    })
  } catch (error) {
    await storage.remove({ s3Key: stored.key, s3Url: stored.storage === 'local' ? 'local' : null })
    throw error
  }
  return toReportResponse(report)
}

async function listReports(user, profileIdValue) {
  const filter = { userId: String(user._id) }
  if (profileIdValue && profileIdValue !== 'all') filter.profileId = String(profileIdValue)
  const reports = await Report.find(filter).sort({ createdAt: -1 }).lean()
  return reports.map(toReportResponse)
}

async function renameReport(user, id, data) {
  const name = String(data.name || '').trim()
  const report = await Report.findOneAndUpdate({ _id: id, userId: String(user._id) }, { name }, { new: true })
  if (!report) throw messageError('Report not found.', 404)
  return toReportResponse(report)
}

async function getReportFile(user, id) {
  const report = await Report.findOne({ _id: id, userId: String(user._id) })
  if (!report) throw messageError('Report not found.', 404)
  return { buffer: await storage.read(report), mimeType: report.mimeType, name: report.name }
}

async function deleteReport(user, id) {
  const report = await Report.findOne({ _id: id, userId: String(user._id) })
  if (!report) throw messageError('Report not found.', 404)
  await storage.remove(report)
  await report.deleteOne()
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}

module.exports = { deleteReport, getReportFile, listReports, renameReport, uploadReport }
