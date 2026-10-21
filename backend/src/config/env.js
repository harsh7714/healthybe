const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const { DEFAULT_FRONTEND_ORIGIN, DEFAULT_PORT } = require('./constants')

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || DEFAULT_PORT),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthybe',
  frontendOrigin: process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN,
}

function validateEnv() {
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }

  const awsKeys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME']
  const configuredAwsKeys = awsKeys.filter(key => Boolean(process.env[key]))
  if (configuredAwsKeys.length > 0 && configuredAwsKeys.length < awsKeys.length) {
    console.warn(`AWS report storage is partially configured (${configuredAwsKeys.join(', ')}). Local storage will be used.`)
  }

  const smtpKeys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
  const configuredSmtpKeys = smtpKeys.filter(key => Boolean(process.env[key]))
  if (configuredSmtpKeys.length > 0 && configuredSmtpKeys.length < smtpKeys.length) {
    console.warn(`Password recovery email is partially configured (${configuredSmtpKeys.join(', ')}).`)
  }

  if (!process.env.GEMINI_API_KEY) console.warn('GEMINI_API_KEY is missing; AI chat requests will not be available.')
}

module.exports = { env, validateEnv }
