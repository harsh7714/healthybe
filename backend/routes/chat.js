const express = require('express')
const { chatWithGemini } = require('../services/geminiService')
const asyncHandler = require('../middleware/asyncHandler')
const { aiChatLimiter } = require('../middleware/rateLimiter')
const { validateChat } = require('../middleware/validator')
const AppError = require('../utils/AppError')

const router = express.Router()

/* POST /api/chat
   Sends a user message + patient health context to Gemini AI
   Protected by aiChatLimiter and validateChat */
router.post('/api/chat', aiChatLimiter, validateChat, asyncHandler(async (req, res) => {
  const { message, context, language } = req.body

  try {
    const reply = await chatWithGemini(message, context || 'No patient health data available.', language || 'English')
    res.json({ success: true, reply })
  } catch (err) {
    throw new AppError(err.message || 'AI service unavailable. Please try again later.', 503)
  }
}))

module.exports = router
