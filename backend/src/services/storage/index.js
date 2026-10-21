const s3Storage = require('./s3.storage')
const localStorage = require('./local.storage')

function isS3Configured() {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION)
}

function activeStorage() {
  return isS3Configured() ? s3Storage : localStorage
}

function save(key, buffer, mimeType, metadata) {
  return activeStorage().save(key, buffer, mimeType, metadata)
}

function read(report) {
  return localStorage.isLocalReport(report) ? localStorage.read(report) : s3Storage.read(report)
}

function remove(report) {
  if (localStorage.isLocalReport(report)) return localStorage.remove(report)
  if (isS3Configured()) return s3Storage.remove(report)
  throw new Error('Cloud storage is not configured; refusing to remove report metadata while leaving the file behind.')
}

function getStorageType(report) {
  if (report.s3Url === 'local') return 'local'
  return isS3Configured() ? 'cloud' : 'local'
}

module.exports = { getStorageType, read, remove, save }
