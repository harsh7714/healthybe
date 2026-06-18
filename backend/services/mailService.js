const nodemailer = require('nodemailer')

let transporter = null

async function getTransporter() {
  if (transporter) return transporter

  let host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  // Auto-correct SMTP Host if using Gmail or if host looks like an email address
  if (user && user.endsWith('@gmail.com')) {
    if (!host || host.includes('@') || (host.toLowerCase().includes('gmail.com') && !host.toLowerCase().startsWith('smtp.'))) {
      host = 'smtp.gmail.com'
      console.log(`✉️ Auto-corrected SMTP_HOST to: ${host} for Gmail address: ${user}`)
    }
  }

  // Check if real credentials are set (we check if they are not the defaults or placeholders)
  const isRealCredentialsSet = user && pass && !user.includes('healthybe.app@gmail.com') && !pass.includes('your_app_password')

  if (isRealCredentialsSet) {
    // Real SMTP configuration
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    })
    console.log(`✉️ Mail Service initialized with real SMTP account: ${user} (Host: ${host || 'smtp.gmail.com'})`)
  } else {
    // Fallback: create a test Ethereal account
    try {
      console.log('✉️ No SMTP credentials in .env. Creating Ethereal Test Account...')
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      })
      console.log(`✉️ Mail Service initialized with Ethereal Test Account user: ${testAccount.user}`)
      console.log(`✉️ Password: ${testAccount.pass}`)
    } catch (err) {
      console.warn('⚠️ Failed to create Ethereal Test Account. Falling back to console-only logger.', err.message)
      transporter = {
        sendMail: async (options) => {
          console.log('\n==================================================')
          console.log(`✉️ MOCK EMAIL SENT TO: ${options.to}`)
          console.log(`SUBJECT: ${options.subject}`)
          console.log(`BODY:\n${options.text}`)
          console.log('==================================================\n')
          return { messageId: 'console-mock-id', mock: true }
        }
      }
    }
  }

  return transporter
}

async function sendOtpEmail(email, otp) {
  try {
    const mailClient = await getTransporter()
    let fromAddress = process.env.SMTP_FROM || '"HealthyBe" <noreply@healthybe.com>'
    // If fromAddress has no email format (no '@' or '<') but SMTP_USER exists, format it
    if (fromAddress && !fromAddress.includes('@') && !fromAddress.includes('<') && process.env.SMTP_USER) {
      fromAddress = `"${fromAddress.replace(/"/g, '')}" <${process.env.SMTP_USER}>`
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #ffffff; font-weight: bold; font-size: 20px;">H</div>
          <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800; font-size: 22px; tracking-tight">HealthyBe Account Security</h2>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Use the following One-Time Password (OTP) to complete your verification:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">This code is valid for <strong>5 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; 2026 HealthyBe Platform. All rights reserved.</p>
      </div>
    `

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `HealthyBe Verification Code: ${otp}`,
      text: `Your HealthyBe verification code is: ${otp}. It is valid for 5 minutes.`,
      html: htmlContent
    }

    const info = await mailClient.sendMail(mailOptions)
    
    // If using Ethereal, log the preview URL
    if (info.messageId && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log(`✉️ Test Email Preview URL: ${previewUrl}`)
        return { success: true, previewUrl }
      }
    }

    return { success: true }
  } catch (err) {
    console.error('sendOtpEmail service error:', err.message)
    throw err
  }
}

async function sendDeleteOtpEmail(email, otp) {
  try {
    const mailClient = await getTransporter()
    let fromAddress = process.env.SMTP_FROM || '"HealthyBe" <noreply@healthybe.com>'
    if (fromAddress && !fromAddress.includes('@') && !fromAddress.includes('<') && process.env.SMTP_USER) {
      fromAddress = `"${fromAddress.replace(/"/g, '')}" <${process.env.SMTP_USER}>`
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fda4af; border-radius: 12px; background-color: #fff1f2; color: #9f1239;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background-color: #e11d48; color: #ffffff; font-weight: bold; font-size: 20px;">⚠️</div>
          <h2 style="color: #9f1239; margin-top: 10px; font-weight: 800; font-size: 22px; tracking-tight">HealthyBe Account Deletion</h2>
        </div>
        <p style="color: #4c0519; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #4c0519; font-size: 16px; line-height: 1.6;"><strong>WARNING: Permanent Deletion Request</strong></p>
        <p style="color: #4c0519; font-size: 15px; line-height: 1.6;">We received a request to permanently delete your HealthyBe vault account, including all S3 files, family member profiles, and AI diagnostics telemetry. This action is permanent and cannot be undone.</p>
        <p style="color: #4c0519; font-size: 15px; line-height: 1.6;">Use the following One-Time Password (OTP) code to confirm your account deletion:</p>
        <div style="background-color: #ffffff; border: 1px dashed #f43f5e; padding: 15px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #e11d48; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #881337; font-size: 13px; line-height: 1.6;">This code is valid for <strong>5 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #fda4af; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; 2026 HealthyBe Platform. All rights reserved.</p>
      </div>
    `

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `⚠️ HealthyBe Deletion Code: ${otp}`,
      text: `Your HealthyBe account deletion code is: ${otp}. This action is permanent.`,
      html: htmlContent
    }

    const info = await mailClient.sendMail(mailOptions)
    
    if (info.messageId && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log(`✉️ Deletion Test Email Preview URL: ${previewUrl}`)
        return { success: true, previewUrl }
      }
    }

    return { success: true }
  } catch (err) {
    console.error('sendDeleteOtpEmail service error:', err.message)
    throw err
  }
}

module.exports = {
  sendOtpEmail,
  sendDeleteOtpEmail
}
