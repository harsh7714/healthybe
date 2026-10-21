const express = require('express')

const authRouter = require('./auth.routes')
const profileRouter = require('./profile.routes')
const reportRouter = require('./report.routes')
const chatRouter = require('./chat.routes')

const router = express.Router()
router.use('/api', authRouter)
router.use('/api', profileRouter)
router.use('/api', reportRouter)
router.use('/api', chatRouter)

module.exports = router
