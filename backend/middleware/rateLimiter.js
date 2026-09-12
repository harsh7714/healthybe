const rateLimit = require('express-rate-limit')

/**
 * Rate limiters for HealthyBe API endpoints.
 */

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/' || req.path === '/health' || req.method === 'HEAD',
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
})

// Authentication limiter (brute-force protection for login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
})

// AI Chat rate limiter (protect Gemini API quotas & costs)
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'You are sending messages too fast. Please pause for a moment before continuing.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
})

// Document upload limiter (protect disk & memory from spam uploads)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 file uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached. Please wait a few minutes before uploading more reports.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
})

module.exports = {
  apiLimiter,
  authLimiter,
  aiChatLimiter,
  uploadLimiter
}
