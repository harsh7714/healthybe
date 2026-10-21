/**
 * errorHandler - Global error-handling middleware for Express.
 * Formats operational and programmer errors into consistent JSON responses.
 */
const logger = require('../utils/logger')

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500
  let message = statusCode >= 500 && !err.isOperational ? 'Something went wrong. Please try again.' : (err.message || 'Request failed.')
  let details = err.details || null

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Resource not found. Invalid identifier for path: ${err.path}`
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `Duplicate value entered for ${field}. Please use another value.`
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed'
    details = Object.values(err.errors).map(e => e.message)
  }

  // Handle Multer file upload limit errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400
    message = 'File size limit exceeded (maximum allowed is 20MB).'
  }

  // Log non-operational (unexpected) errors
  if (!err.isOperational && statusCode === 500) {
    logger.error(`[CRITICAL ERROR] ${req.method} ${req.originalUrl}:`, err)
  } else {
    logger.warn(`[WARN] ${req.method} ${req.originalUrl} (${statusCode}): ${message}`)
  }

  const response = err.responseBody || {
    success: false,
    message,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  }

  if (!err.responseBody && details) {
    response.details = details
  }

  if (!err.responseBody && process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}

module.exports = errorHandler
