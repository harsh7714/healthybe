const crypto = require('crypto')
const Session = require('../models/session.model')
const User = require('../models/user.model')

module.exports = async function requireAuth(req, res, next) {
  try {
    const cookieHeader = req.headers.cookie || ''
    const token = cookieHeader
      .split(';')
      .map(item => item.trim())
      .find(item => item.startsWith('healthybe_session='))
      ?.slice('healthybe_session='.length)
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' })
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } })
    if (!session)
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    const user = await User.findById(session.userId).select('_id email name')
    if (!user) return res.status(401).json({ message: 'Account not found.' })
    req.user = user
    req.sessionId = session._id
    next()
  } catch (error) {
    next(error)
  }
}
