const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const apiRouter = require('./routes')
const requestLogger = require('./middleware/requestLogger.middleware')
const { apiLimiter } = require('./middleware/rateLimit.middleware')
const errorHandler = require('./middleware/error.middleware')
const notFound = require('./middleware/notFound.middleware')
const { env } = require('./config/env')
const { API_VERSION_PREFIX } = require('./config/constants')

const app = express()

app.set('trust proxy', 1)

app.route('/')
  .get((_req, res) => res.status(200).json({ status: 'ok', service: 'HealthyBe API', version: '1.1.0' }))
  .head((_req, res) => res.status(200).end())

app.route('/health')
  .get((_req, res) => res.status(200).json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
  .head((_req, res) => res.status(200).end())

app.use(cors({ origin: env.frontendOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }))
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') && req.get('origin') !== env.frontendOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }
  next()
})
app.use(requestLogger)
app.use(apiLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

const versionedApiRouter = express.Router()
versionedApiRouter.use((req, _res, next) => {
  req.url = `/api${req.url === '/' ? '' : req.url}`
  next()
})
versionedApiRouter.use(apiRouter)
app.use(API_VERSION_PREFIX, versionedApiRouter)
app.use(apiRouter)

app.all('*', notFound)
app.use(errorHandler)

module.exports = app
