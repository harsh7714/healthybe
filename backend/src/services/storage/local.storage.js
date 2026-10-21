const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const root = path.resolve(__dirname, '../../../uploads')

function isLocalReport(report) {
  return typeof report.s3Url === 'string' && (
    report.s3Url.startsWith('data:') || report.s3Url === 'local' || report.s3Url.startsWith('/uploads/')
  )
}

async function save(key, buffer) {
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Cloud report storage is not configured on this server.')
    error.statusCode = 503
    error.isOperational = true
    throw error
  }
  await fs.mkdir(root, { recursive: true })
  const fileName = `${crypto.randomUUID()}${path.extname(key)}`
  await fs.writeFile(path.join(root, fileName), buffer, { flag: 'wx' })
  return { storage: 'local', key: fileName }
}

async function read(report) {
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('data:')) {
    const match = report.s3Url.match(/^data:[^;,]+;base64,([\s\S]+)$/)
    if (!match) throw new Error('Stored report has invalid legacy file data.')
    return Buffer.from(match[1], 'base64')
  }
  if (report.s3Url === 'local') return fs.readFile(path.join(root, path.basename(report.s3Key)))
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('/uploads/')) {
    return fs.readFile(path.join(root, path.basename(report.s3Url)))
  }
  throw new Error('Report is not stored locally.')
}

async function remove(report) {
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('data:')) return
  if (report.s3Url === 'local') return fs.rm(path.join(root, path.basename(report.s3Key)), { force: true })
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('/uploads/')) {
    return fs.rm(path.join(root, path.basename(report.s3Url)), { force: true })
  }
}

module.exports = { isLocalReport, read, remove, save }
