/**
 * AppError - Custom error class for operational errors with HTTP status codes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null, responseBody = null) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    this.details = details
    this.responseBody = responseBody

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
