const AppError = require('../utils/AppError')

function validateRegistration(req) {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')

  if (name.length < 2 || name.length > 80) throw messageError('Name must be 2â€“80 characters.', 400)
  if (!/^\S+@\S+\.\S+$/.test(email)) throw messageError('Enter a valid email address.', 400)
  if (password.length < 10) throw messageError('Use a password with at least 10 characters.', 400)
}

function validatePasswordReset(req) {
  if (String(req.body.password || '').length < 10) {
    throw messageError('Use a password with at least 10 characters.', 400)
  }
}

function validateAccountDeletion(req) {
  if (req.body.confirmation !== 'DELETE') {
    throw messageError('Type DELETE to confirm account removal.', 400)
  }
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}

module.exports = { validateAccountDeletion, validatePasswordReset, validateRegistration }
