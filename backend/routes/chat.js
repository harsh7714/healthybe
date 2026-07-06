const express = require('express')
const { chatWithGemini } = require('../services/geminiService')

const router = express.Router()

/* POST /api/chat
   Sends a user message + patient health context to Gemini 2.5 Flash
   and returns an AI-generated response */
router.post('/api/chat', async (req, res) => {
  try {
    const { message, context, language } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })

    const reply = await chatWithGemini(message, context || 'No patient health data available.', language || 'English')
    res.json({ reply })
  } catch (err) {
    console.error('POST /api/chat error:', err.message)
    res.status(500).json({ error: err.message || 'AI service unavailable' })
  }
})

module.exports = router
