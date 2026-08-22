const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Report = require('../models/Report')
const { sendOtpEmail, sendDeleteOtpEmail } = require('../services/mailService')
const { deleteFromS3 } = require('../services/s3Service')
const getUserId = require('../utils/getUserId')

const router = express.Router()

/* ─── OTP Store ────────────────────────────────────────────────── */
const otps = new Map() // email -> { otp, expiresAt, verified }
const deleteAccountOtps = new Map()

// Register a new user and pre-create family profiles
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password, age } = req.body
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, Name, and Password are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const trimName = name.trim()

    // Check if user already exists
    let user = await User.findOne({ email: trimEmail })
    if (user) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in instead.' })
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

    res.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (err) {
    console.error('Registration error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Sign in checking if email and password match
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: trimEmail })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    res.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/send-otp
router.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: trimEmail })
    if (!user) {
      return res.status(404).json({ error: 'Email is not registered. Please create an account first.' })
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
  } catch (err) {
    console.error('send-otp error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/verify-otp
router.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const record = otps.get(trimEmail)

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email.' })
    }

    if (Date.now() > record.expiresAt) {
      otps.delete(trimEmail)
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' })
    }

    // Mark as verified
    record.verified = true
    otps.set(trimEmail, record)

    res.json({ success: true, message: 'OTP verified successfully.' })
  } catch (err) {
    console.error('verify-otp error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/reset-password
router.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new Password are required.' })
    }

    const trimEmail = email.trim().toLowerCase()
    const record = otps.get(trimEmail)

    if (!record || !record.verified || record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Unauthorized. Please verify your OTP first.' })
    }

    const user = await User.findOne({ email: trimEmail })
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    await user.save()

    // Clean up OTP
    otps.delete(trimEmail)

    res.json({ success: true, message: 'Password has been reset successfully.' })
  } catch (err) {
    console.error('reset-password error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Direct Account Deletion without OTP requirement
const handleAccountDeletion = async (req, res) => {
  try {
    const { email } = req.body
    const sessionEmail = req.headers['x-user-email']

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const trimEmail = email.trim().toLowerCase()

    if (!sessionEmail || sessionEmail.trim().toLowerCase() !== trimEmail) {
      return res.status(403).json({ error: 'Unauthorized account delete request.' })
    }

    const user = await User.findOne({ email: trimEmail })
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' })
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
  } catch (err) {
    console.error('delete-account error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

router.post('/api/auth/delete-account', handleAccountDeletion)
router.post('/api/auth/confirm-delete-account', handleAccountDeletion)
router.post('/api/auth/send-delete-otp', (_req, res) => res.json({ success: true, message: 'OTP bypass active.' }))

module.exports = router
