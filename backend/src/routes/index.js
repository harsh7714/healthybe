const express = require('express')

const authRouter = require('./auth.routes')
const legacyProfileRouter = require('../../routes/profiles')
const legacyReportRouter = require('../../routes/reports')
const legacyChatRouter = require('../../routes/chat')

const router = express.Router()
router.use('/api', authRouter)
router.use(legacyProfileRouter)
router.use(legacyReportRouter)
router.use(legacyChatRouter)

module.exports = router
