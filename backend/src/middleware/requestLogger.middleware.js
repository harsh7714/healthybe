/**
 * requestLogger - Structured HTTP request and response logging middleware.
 */
const logger = require('../utils/logger')

const requestLogger = (req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusPrefix = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢'

    logger.info(`${statusPrefix} [${timestamp}] ${req.method} ${req.originalUrl} ${status} - ${duration}ms`)
  })

  next()
}

module.exports = requestLogger
