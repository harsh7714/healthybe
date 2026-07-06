const express = require('express')
const authRouter = require('./auth')
const reportsRouter = require('./reports')
const profilesRouter = require('./profiles')
const chatRouter = require('./chat')

const router = express.Router()

router.use(authRouter)
router.use(reportsRouter)
router.use(profilesRouter)
router.use(chatRouter)

module.exports = router
