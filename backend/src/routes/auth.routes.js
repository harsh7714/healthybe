const express = require('express')

const authController = require('../controllers/auth.controller')
const requireAuth = require('../middleware/auth.middleware')
const authLimiter = require('../middleware/rateLimit.middleware').authLimiter
const validate = require('../middleware/validate.middleware')
const authValidator = require('../validators/auth.validator')

const router = express.Router()

router.get('/auth/me', authController.getCurrentUser)
router.post('/auth/register', authLimiter, validate(authValidator.validateRegistration), authController.register)
router.post('/auth/login', authLimiter, authController.login)
router.post('/auth/logout', authController.logout)
router.post('/auth/forgot-password', authLimiter, authController.requestPasswordReset)
router.post('/auth/reset-password', authLimiter, validate(authValidator.validatePasswordReset), authController.resetPassword)
router.delete('/auth/account', requireAuth, validate(authValidator.validateAccountDeletion), authController.deleteAccount)

module.exports = router
