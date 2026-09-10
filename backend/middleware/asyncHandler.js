/**
 * asyncHandler - Wraps an async route handler to catch rejected promises and forward to next(err).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
