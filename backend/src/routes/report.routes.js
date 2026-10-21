const express = require('express')

const reportController = require('../controllers/report.controller')
const requireAuth = require('../middleware/auth.middleware')
const { uploadLimiter } = require('../middleware/rateLimit.middleware')
const { memoryUpload } = require('../middleware/upload.middleware')
const validate = require('../middleware/validate.middleware')
const reportValidator = require('../validators/report.validator')

const router = express.Router()

router.use('/reports', requireAuth)
router.post(
  '/upload',
  uploadLimiter,
  requireAuth,
  memoryUpload.single('file'),
  reportController.upload,
)
router.get('/reports', reportController.list)
router.patch('/reports/:id', validate(reportValidator.validateRename), reportController.rename)
router.get('/reports/:id/file', reportController.readFile)
router.delete('/reports/:id', reportController.remove)

module.exports = router
