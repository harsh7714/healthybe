const asyncHandler = require('../utils/asyncHandler')
const authService = require('../services/auth.service')

exports.getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: await authService.getCurrentUser(req.headers.cookie || '') })
})

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body)
  res.cookie(authService.COOKIE, token, authService.cookieOptions)
  res.status(201).json({ user })
})

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body)
  res.cookie(authService.COOKIE, token, authService.cookieOptions)
  res.json({ user })
})

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.headers.cookie || '')
  res.clearCookie(authService.COOKIE, authService.logoutCookieOptions)
  res.json({ ok: true })
})

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  res.json(await authService.requestPasswordReset(req.body.email))
})

exports.resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(req.body))
})

exports.deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user._id, req.body)
  res.clearCookie(authService.COOKIE, { ...authService.cookieOptions, maxAge: undefined })
  res.json({ ok: true })
})
