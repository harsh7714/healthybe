const AppError = require('../utils/AppError')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validation middlewares for incoming request payloads.
 */

const validateRegister = (req, _res, next) => {
  const { email, name, password } = req.body || {}
  const errors = []

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.')
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required.')
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.')
  }

  if (errors.length > 0) {
    return next(new AppError(errors[0], 400, errors))
  }
  next()
}

const validateLogin = (req, _res, next) => {
  const { email, password } = req.body || {}
  const errors = []

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.')
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.')
  }

  if (errors.length > 0) {
    return next(new AppError(errors[0], 400, errors))
  }
  next()
}

const validateForgotPassword = (req, _res, next) => {
  const { email } = req.body || {}
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return next(new AppError('A valid email address is required.', 400))
  }
  next()
}

const validateVerifyOtp = (req, _res, next) => {
  const { email, otp } = req.body || {}
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return next(new AppError('A valid email address is required.', 400))
  }
  if (!otp || !/^\d{6}$/.test(`${otp}`.trim())) {
    return next(new AppError('A valid 6-digit OTP code is required.', 400))
  }
  next()
}

const validateResetPassword = (req, _res, next) => {
  const { email, otp, newPassword } = req.body || {}
  const errors = []

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.')
  }
  if (!otp || !/^\d{6}$/.test(`${otp}`.trim())) {
    errors.push('A valid 6-digit OTP code is required.')
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long.')
  }

  if (errors.length > 0) {
    return next(new AppError(errors[0], 400, errors))
  }
  next()
}

const validateChat = (req, _res, next) => {
  const { message, attachment } = req.body || {}
  const hasText = message && typeof message === 'string' && message.trim().length > 0
  const hasAttachment = Boolean(attachment && (attachment.name || attachment.data || attachment.url))

  if (!hasText && !hasAttachment) {
    return next(new AppError('Please provide a message or attach a medical report/image.', 400))
  }
  if (message && typeof message === 'string' && message.length > 5000) {
    return next(new AppError('Message exceeds maximum length of 5000 characters.', 400))
  }
  next()
}

const validateCreateProfile = (req, _res, next) => {
  const { name, relation } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new AppError('Profile name is required.', 400))
  }
  if (!relation || typeof relation !== 'string' || !relation.trim()) {
    return next(new AppError('Profile relation is required.', 400))
  }
  next()
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
  validateChat,
  validateCreateProfile
}
