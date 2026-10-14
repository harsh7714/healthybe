const nodemailer = require('nodemailer')

async function sendPasswordResetCode(email, code) {
  const { SMTP_HOST, SMTP_PORT = '587', SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const error = new Error('Password recovery email is not configured on this server.')
    error.statusCode = 503
    error.isOperational = true
    throw error
  }
  const port = Number(SMTP_PORT)
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000 })
  await transporter.sendMail({ from: SMTP_FROM?.includes('@') ? SMTP_FROM : `HealthyBe <${SMTP_USER}>`, to: email, subject: 'Your HealthyBe password reset code', text: `Your HealthyBe reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.` })
}

module.exports = { sendPasswordResetCode }
