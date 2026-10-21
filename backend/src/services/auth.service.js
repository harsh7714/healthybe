const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const User = require('../models/user.model')
const Profile = require('../models/profile.model')
const Report = require('../models/report.model')
const Session = require('../models/session.model')
const ChatSession = require('../models/chatSession.model')
const PasswordReset = require('../models/passwordReset.model')
const AppError = require('../utils/AppError')
const { sendPasswordResetCode } = require('../../services/passwordEmail')
const { removeReport } = require('../../services/reportStorage')

const COOKIE = 'healthybe_session'
const cookieMaxAge = 30 * 24 * 60 * 60 * 1000
const isSecure = process.env.NODE_ENV === 'production'
const cookieOptions = { httpOnly: true, secure: isSecure, sameSite: isSecure ? 'none' : 'lax', path: '/', maxAge: cookieMaxAge }
const logoutCookieOptions = { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/' }
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const publicUser = user => ({ id: String(user._id), email: user.email, name: user.name })

async function createSession(user) {
  const token = crypto.randomBytes(32).toString('base64url')
  await Session.create({ tokenHash: hash(token), userId: String(user._id), expiresAt: new Date(Date.now() + cookieMaxAge) })
  return token
}

function readSessionToken(cookieHeader = '') {
  return cookieHeader.split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
}

async function getCurrentUser(cookieHeader) {
  const token = readSessionToken(cookieHeader)
  if (!token) return null
  const session = await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } })
  const user = session ? await User.findById(session.userId).select('_id email name') : null
  return user ? publicUser(user) : null
}

async function register(data) {
  const name = String(data.name || '').trim()
  const email = String(data.email || '').trim().toLowerCase()
  const password = String(data.password || '')
  if (await User.exists({ email })) throw messageError('An account already uses this email.', 409)
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) })
  await Profile.create({ userId: String(user._id), id: 'self', name, relation: 'Self', initials: name.slice(0, 2).toUpperCase() })
  return { user: publicUser(user), token: await createSession(user) }
}

async function login(data) {
  const email = String(data.email || '').trim().toLowerCase()
  const user = await User.findOne({ email })
  if (!user || !await bcrypt.compare(String(data.password || ''), user.password)) {
    throw messageError('Email or password is incorrect.', 401)
  }
  await Promise.all([
    Profile.updateMany({ userId: email }, { userId: String(user._id) }),
    Report.updateMany({ userId: email }, { userId: String(user._id) }),
    ChatSession.updateMany({ userId: email }, { userId: String(user._id) }),
  ])
  return { user: publicUser(user), token: await createSession(user) }
}

async function logout(cookieHeader) {
  const token = readSessionToken(cookieHeader)
  if (token) await Session.deleteOne({ tokenHash: hash(token) })
}

async function requestPasswordReset(emailValue) {
  const email = String(emailValue || '').trim().toLowerCase()
  const user = await User.findOne({ email })
  if (user) {
    const code = String(crypto.randomInt(100000, 1000000))
    await PasswordReset.deleteMany({ email })
    await PasswordReset.create({ email, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
    try {
      await sendPasswordResetCode(email, code)
    } catch (error) {
      await PasswordReset.deleteMany({ email })
      console.warn('Password reset email could not be delivered.')
    }
  }
  return { message: 'If an account matches that email, a verification code has been sent.' }
}

async function resetPassword(data) {
  const email = String(data.email || '').trim().toLowerCase()
  const code = String(data.code || '').trim()
  const password = String(data.password || '')
  const reset = await PasswordReset.findOne({ email, expiresAt: { $gt: new Date() } })
  if (!reset || !await bcrypt.compare(code, reset.codeHash)) throw messageError('The code is invalid or expired.', 400)
  const user = await User.findOneAndUpdate({ email }, { password: await bcrypt.hash(password, 12) }, { new: true })
  await Promise.all([PasswordReset.deleteMany({ email }), Session.deleteMany({ userId: String(user._id) })])
  return { ok: true, message: 'Password updated. Please sign in.' }
}

async function deleteAccount(userId, data) {
  const user = await User.findById(userId)
  if (!await bcrypt.compare(String(data.password || ''), user.password)) throw messageError('Password is incorrect.', 401)
  const reports = await Report.find({ userId: String(user._id) })
  await Promise.all(reports.map(removeReport))
  await Promise.all([
    Report.deleteMany({ userId: String(user._id) }), Profile.deleteMany({ userId: String(user._id) }),
    ChatSession.deleteMany({ userId: String(user._id) }), Session.deleteMany({ userId: String(user._id) }),
    User.deleteOne({ _id: user._id }),
  ])
}

module.exports = {
  COOKIE,
  cookieOptions,
  deleteAccount,
  getCurrentUser,
  login,
  logout,
  logoutCookieOptions,
  register,
  requestPasswordReset,
  resetPassword,
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}
