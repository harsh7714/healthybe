const asyncHandler = require('../utils/asyncHandler')
const reportService = require('../services/report.service')

exports.upload = asyncHandler(async (req, res) => {
  const report = await reportService.uploadReport(req.user, req.body, req.file)
  res.status(201).json(report)
})

exports.list = asyncHandler(async (req, res) => {
  res.json(await reportService.listReports(req.user, req.query.profileId))
})

exports.rename = asyncHandler(async (req, res) => {
  res.json(await reportService.renameReport(req.user, req.params.id, req.body))
})

exports.readFile = asyncHandler(async (req, res) => {
  const file = await reportService.getReportFile(req.user, req.params.id)
  res
    .type(file.mimeType || 'application/octet-stream')
    .set({
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    .send(file.buffer)
})

exports.remove = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.user, req.params.id)
  res.json({ ok: true })
})
