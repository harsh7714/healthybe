const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Session = require('../models/Session')
const PasswordReset = require('../models/PasswordReset')
const requireAuth = require('../middleware/requireAuth')
const { sendPasswordResetCode } = require('../services/passwordEmail')
const { authLimiter } = require('../middleware/rateLimiter')

const router = express.Router()
for (const endpoint of ['/register', '/login', '/forgot-password', '/reset-password']) router.post(`/api/auth${endpoint}`, authLimiter)
const COOKIE = 'healthybe_session'
const isSecure = process.env.NODE_ENV === 'production'
const cookieOptions = { httpOnly: true, secure: isSecure, sameSite: isSecure ? 'none' : 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 }
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const publicUser = user => ({ id: String(user._id), email: user.email, name: user.name })
const setSession = async (user, res) => {
  const token = crypto.randomBytes(32).toString('base64url')
  await Session.create({ tokenHash: hash(token), userId: String(user._id), expiresAt: new Date(Date.now() + cookieOptions.maxAge) })
  res.cookie(COOKIE, token, cookieOptions)
}

router.get('/api/auth/me', async (req, res, next) => {
  try {
    const token = (req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
    if (!token) return res.json({ user: null })
    const session = await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } })
    const user = session ? await User.findById(session.userId).select('_id email name') : null
    res.json({ user: user ? publicUser(user) : null })
  } catch (error) { next(error) }
})
router.post('/api/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be 2–80 characters.' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 10) return res.status(400).json({ message: 'Use a password with at least 10 characters.' })
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account already uses this email.' })
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) })
    await Profile.create({ userId: String(user._id), id: 'self', name, relation: 'Self', initials: name.slice(0, 2).toUpperCase() })
    await setSession(user, res)
    res.status(201).json({ user: publicUser(user) })
  } catch (error) { next(error) }
})
router.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const user = await User.findOne({ email })
    if (!user || !await bcrypt.compare(String(req.body.password || ''), user.password)) return res.status(401).json({ message: 'Email or password is incorrect.' })
    await Promise.all([
      Profile.updateMany({ userId: email }, { userId: String(user._id) }),
      require('../models/Report').updateMany({ userId: email }, { userId: String(user._id) }),
      require('../models/ChatSession').updateMany({ userId: email }, { userId: String(user._id) }),
    ])
    await setSession(user, res)
    res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})
router.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = (req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
    if (token) await Session.deleteOne({ tokenHash: hash(token) })
    res.clearCookie(COOKIE, { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/' })
    res.json({ ok: true })
  } catch (error) { next(error) }
})
router.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const user = await User.findOne({ email })
    if (user) {
      const code = String(crypto.randomInt(100000, 1000000))
      await PasswordReset.deleteMany({ email })
      await PasswordReset.create({ email, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
      try { await sendPasswordResetCode(email, code) }
      catch (error) { await PasswordReset.deleteMany({ email }); console.warn('Password reset email could not be delivered.') }
    }
    res.json({ message: 'If an account matches that email, a verification code has been sent.' })
  } catch (error) { next(error) }
})
router.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const code = String(req.body.code || '').trim()
    const password = String(req.body.password || '')
    if (password.length < 10) return res.status(400).json({ message: 'Use a password with at least 10 characters.' })
    const reset = await PasswordReset.findOne({ email, expiresAt: { $gt: new Date() } })
    if (!reset || !await bcrypt.compare(code, reset.codeHash)) return res.status(400).json({ message: 'The code is invalid or expired.' })
    const user = await User.findOneAndUpdate({ email }, { password: await bcrypt.hash(password, 12) }, { new: true })
    await Promise.all([PasswordReset.deleteMany({ email }), Session.deleteMany({ userId: String(user._id) })])
    res.json({ ok: true, message: 'Password updated. Please sign in.' })
  } catch (error) { next(error) }
})
router.delete('/api/auth/account', requireAuth, async (req, res, next) => {
  try {
    if (req.body.confirmation !== 'DELETE') return res.status(400).json({ message: 'Type DELETE to confirm account removal.' })
    const user = await User.findById(req.user._id)
    if (!await bcrypt.compare(String(req.body.password || ''), user.password)) return res.status(401).json({ message: 'Password is incorrect.' })
    const Report = require('../models/Report')
    const ChatSession = require('../models/ChatSession')
    const reports = await Report.find({ userId: String(user._id) })
    await Promise.all(reports.map(report => require('../services/reportStorage').removeReport(report)))
    await Promise.all([
      Report.deleteMany({ userId: String(user._id) }), Profile.deleteMany({ userId: String(user._id) }),
      ChatSession.deleteMany({ userId: String(user._id) }), Session.deleteMany({ userId: String(user._id) }),
      User.deleteOne({ _id: user._id }),
    ])
    res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined })
    res.json({ ok: true })
  } catch (error) { next(error) }
})

module.exports = router
