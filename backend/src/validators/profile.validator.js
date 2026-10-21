const AppError = require('../utils/AppError')

function validateProfileCreate(req) {
  const name = String(req.body.name || '').trim()
  const relation = String(req.body.relation || '').trim()
  if (!name || name.length > 80 || !relation || relation.length > 40) {
    const message = 'Enter a valid name and relationship.'
    throw new AppError(message, 400, null, { message })
  }
}

module.exports = { validateProfileCreate }
