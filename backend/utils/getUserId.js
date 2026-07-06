const getUserId = (req) => {
  const email = req.headers['x-user-email'] || req.query.userId || req.body.userId || 'self'
  return typeof email === 'string' ? email.trim().toLowerCase() : email
}

module.exports = getUserId
