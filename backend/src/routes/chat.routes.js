const express = require('express')

const chatController = require('../controllers/chat.controller')
const requireAuth = require('../middleware/auth.middleware')
const { aiChatLimiter } = require('../middleware/rateLimit.middleware')
const { memoryUpload } = require('../middleware/upload.middleware')

const router = express.Router()

router.post('/chat', aiChatLimiter, requireAuth, memoryUpload.single('file'), chatController.send)

module.exports = router
