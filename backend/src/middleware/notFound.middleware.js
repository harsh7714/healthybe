const AppError = require('../utils/AppError')

module.exports = (req, _res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404))
}
