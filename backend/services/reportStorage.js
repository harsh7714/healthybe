const fs = require('fs/promises')
const path = require('path')
const { GetObjectCommand } = require('@aws-sdk/client-s3')
const { s3Client, uploadToS3, deleteFromS3 } = require('./s3Service')

const root = path.join(__dirname, '..', 'uploads')
const hasS3 = () => Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION)

async function saveReport(key, buffer, mimeType) {
  if (hasS3()) {
    await uploadToS3(key, buffer, mimeType)
    return { storage: 's3', key }
  }
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Cloud report storage is not configured on this server.')
    error.statusCode = 503
    error.isOperational = true
    throw error
  }
  await fs.mkdir(root, { recursive: true })
  const fileName = `${require('crypto').randomUUID()}${path.extname(key)}`
  await fs.writeFile(path.join(root, fileName), buffer, { flag: 'wx' })
  return { storage: 'local', key: fileName }
}

async function readReport(report) {
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('data:')) {
    const match = report.s3Url.match(/^data:[^;,]+;base64,([\s\S]+)$/)
    if (!match) throw new Error('Stored report has invalid legacy file data.')
    return Buffer.from(match[1], 'base64')
  }
  if (report.s3Url === 'local') return fs.readFile(path.join(root, path.basename(report.s3Key)))
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('/uploads/')) return fs.readFile(path.join(root, path.basename(report.s3Url)))
  const response = await s3Client.send(new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: report.s3Key }))
  const chunks = []
  for await (const chunk of response.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function removeReport(report) {
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('data:')) return
  if (report.s3Url === 'local') return fs.rm(path.join(root, path.basename(report.s3Key)), { force: true })
  if (typeof report.s3Url === 'string' && report.s3Url.startsWith('/uploads/')) return fs.rm(path.join(root, path.basename(report.s3Url)), { force: true })
  if (hasS3()) return deleteFromS3(report.s3Key)
  throw new Error('Cloud storage is not configured; refusing to remove report metadata while leaving the file behind.')
}

module.exports = { saveReport, readReport, removeReport, hasS3 }
