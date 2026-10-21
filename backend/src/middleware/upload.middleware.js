const multer = require('multer')
const AppError = require('../utils/AppError')

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = allowedTypes.includes(file.mimetype)
    callback(allowed ? null : new AppError('Only PDF, JPEG, PNG, and WEBP files are supported.', 400), allowed)
  },
})

module.exports = { memoryUpload }
