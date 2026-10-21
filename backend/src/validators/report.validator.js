const AppError = require('../utils/AppError')

function validateRename(req) {
  const name = String(req.body.name || '').trim()
  if (!name || name.length > 160) {
    const message = 'File name must be 1â€“160 characters.'
    throw new AppError(message, 400, null, { message })
  }
}

module.exports = { validateRename }
