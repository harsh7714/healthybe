const express = require('express')

const profileController = require('../controllers/profile.controller')
const requireAuth = require('../middleware/auth.middleware')
const validate = require('../middleware/validate.middleware')
const profileValidator = require('../validators/profile.validator')

const router = express.Router()

router.use('/profiles', requireAuth)
router.get('/profiles', profileController.list)
router.post('/profiles', validate(profileValidator.validateProfileCreate), profileController.create)
router.patch('/profiles/:id', profileController.update)
router.delete('/profiles/:id', profileController.remove)

module.exports = router
