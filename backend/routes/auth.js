const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Report = require('../models/Report')
const { sendOtpEmail, sendDeleteOtpEmail } = require('../services/mailService')
const { deleteFromS3 } = require('../services/s3Service')
const getUserId = require('../utils/getUserId')
const AppError = require('../utils/AppError')
const asyncHandler = require('../middleware/asyncHandler')
const { authLimiter } = require('../middleware/rateLimiter')
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
} = require('../middleware/validator')

const router = express.Router()

// Apply authentication rate limiting
router.use('/api/auth', authLimiter)

/* ─── OTP Store ────────────────────────────────────────────────── */
const otps = new Map() // email -> { otp, expiresAt, verified }
const deleteAccountOtps = new Map()

// Register a new user and pre-create family profiles
router.post('/api/auth/register', validateRegister, asyncHandler(async (req, res) => {
  const { email, name, password, age } = req.body
  const trimEmail = email.trim().toLowerCase()
  const trimName = name.trim()

  // Check if user already exists
  let user = await User.findOne({ email: trimEmail })
  if (user) {
    throw new AppError('Email is already registered. Please sign in instead.', 400)
  }

  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create the user
  user = await User.create({ email: trimEmail, name: trimName, password: hashedPassword })

  // Pre-create the default family profiles
  const rawName = trimEmail.split('@')[0]
  const userName = trimName || rawName.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const userInitials = userName.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)

  const formattedAge = age ? `${age} Yrs` : "24 Yrs"

  const defaultProfiles = [
    { userId: trimEmail, id: "self", name: userName, relation: "Self (Primary)", age: formattedAge, email: trimEmail, initials: userInitials }
  ]
  
  // Check if profiles already exist for this email to prevent duplicate keys
  const existingProfilesCount = await Profile.countDocuments({ userId: trimEmail })
  if (existingProfilesCount === 0) {
    await Profile.create(defaultProfiles)
  }

  res.status(201).json({ success: true, user: { email: user.email, name: user.name } })
}))

// Sign in checking if email and password match
router.post('/api/auth/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const trimEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: trimEmail })
  if (!user) {
    throw new AppError('Invalid email or password.', 401)
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401)
  }

  res.json({ success: true, user: { email: user.email, name: user.name } })
}))

// POST /api/auth/send-otp
router.post('/api/auth/send-otp', validateForgotPassword, asyncHandler(async (req, res) => {
  const { email } = req.body
  const trimEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: trimEmail })
  if (!user) {
    throw new AppError('Email is not registered. Please create an account first.', 404)
  }

  // Generate random 6-digit code
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity

  // Store it
  otps.set(trimEmail, { otp, expiresAt, verified: false })
  console.log(`🔑 [OTP] Verification code generated for ${trimEmail}`)

  // Send the email (real or Ethereal test inbox fallback)
  try {
    await sendOtpEmail(trimEmail, otp)
  } catch (mailErr) {
    console.warn(`⚠️ Failed to send OTP email to ${trimEmail}:`, mailErr.message)
  }

  res.json({ success: true, message: 'OTP sent successfully.' })
}))

// POST /api/auth/verify-otp
router.post('/api/auth/verify-otp', validateVerifyOtp, asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  const trimEmail = email.trim().toLowerCase()
  const record = otps.get(trimEmail)

  if (!record) {
    throw new AppError('No OTP requested for this email.', 400)
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(trimEmail)
    throw new AppError('OTP has expired. Please request a new one.', 400)
  }

  if (record.otp !== otp.trim()) {
    throw new AppError('Invalid OTP code. Please try again.', 400)
  }

  // Mark as verified
  record.verified = true
  otps.set(trimEmail, record)

  res.json({ success: true, message: 'OTP verified successfully.' })
}))

// POST /api/auth/reset-password
router.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body
  if (!email || !otp || !password) {
    throw new AppError('Email, OTP, and new Password are required.', 400)
  }

  const trimEmail = email.trim().toLowerCase()
  const record = otps.get(trimEmail)

  if (!record || !record.verified || record.otp !== otp.trim()) {
    throw new AppError('Unauthorized. Please verify your OTP first.', 400)
  }

  const user = await User.findOne({ email: trimEmail })
  if (!user) {
    throw new AppError('User not found.', 404)
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(password, 10)
  user.password = hashedPassword
  await user.save()

  // Clean up OTP
  otps.delete(trimEmail)

  res.json({ success: true, message: 'Password has been reset successfully.' })
}))

// Direct Account Deletion without OTP requirement
const handleAccountDeletion = asyncHandler(async (req, res) => {
  const { email } = req.body
  const sessionEmail = req.headers['x-user-email']

  if (!email) {
    throw new AppError('Email is required.', 400)
  }

  const trimEmail = email.trim().toLowerCase()

  if (!sessionEmail || sessionEmail.trim().toLowerCase() !== trimEmail) {
    throw new AppError('Unauthorized account delete request.', 403)
  }

  const user = await User.findOne({ email: trimEmail })
  if (!user) {
    throw new AppError('Account not found.', 404)
  }

  // 1. Delete all reports from cloud storage (S3) or local disk uploads
  const userReports = await Report.find({ userId: trimEmail })
  for (const report of userReports) {
    if (report.s3Key && (!report.s3Url || !report.s3Url.startsWith('data:'))) {
      try {
        await deleteFromS3(report.s3Key)
        console.log(`🗑️ S3 file deleted: ${report.s3Key}`)
      } catch (s3Err) {
        console.warn(`⚠️ Failed to delete S3 key ${report.s3Key}:`, s3Err.message)
      }
    }
  }

  // 2. Delete all records from MongoDB database
  await Report.deleteMany({ userId: trimEmail })
  await Profile.deleteMany({ userId: trimEmail })
  await User.deleteOne({ email: trimEmail })

  console.log(`❌ [ACCOUNT PURGED] Successfully deleted all data for: ${trimEmail}`)
  res.json({ success: true, message: 'Your account and all associated data have been permanently deleted.' })
})

router.post('/api/auth/delete-account', handleAccountDeletion)
router.post('/api/auth/confirm-delete-account', handleAccountDeletion)
router.post('/api/auth/send-delete-otp', (_req, res) => res.json({ success: true, message: 'OTP bypass active.' }))

module.exports = router
