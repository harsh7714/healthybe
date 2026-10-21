const express = require('express')

const authRouter = require('./auth.routes')
const profileRouter = require('./profile.routes')
const legacyReportRouter = require('../../routes/reports')
const legacyChatRouter = require('../../routes/chat')

const router = express.Router()
router.use('/api', authRouter)
router.use('/api', profileRouter)
router.use(legacyReportRouter)
router.use(legacyChatRouter)

module.exports = router
