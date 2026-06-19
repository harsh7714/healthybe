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
    // Real SMTP configuration (with 5-second fast fail timeouts)
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
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
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
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

/**
 * Sends email via HTTP API (port 443) using Resend, Brevo, or SendGrid
 * if they are configured in the environment.
 */
async function sendEmailViaHttp({ to, subject, text, html }) {
  const fromAddress = process.env.SMTP_FROM || 'onboarding@resend.dev'

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    console.log(`✉️ Sending email via Resend HTTP API to: ${to}`)
    let fromEmail = 'onboarding@resend.dev'
    let fromName = 'HealthyBe'
    const match = fromAddress.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/)
    if (match) {
      if (match[1]) fromName = match[1]
      if (match[2] && !match[2].includes('gmail.com')) fromEmail = match[2]
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        text,
        html
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend API error (${res.status}): ${errText}`)
    }
    return { success: true, method: 'resend' }
  }

  // 2. Brevo API
  if (process.env.BREVO_API_KEY) {
    console.log(`✉️ Sending email via Brevo HTTP API to: ${to}`)
    let fromEmail = 'noreply@healthybe.com'
    let fromName = 'HealthyBe'
    const match = fromAddress.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/)
    if (match) {
      if (match[1]) fromName = match[1]
      if (match[2]) fromEmail = match[2]
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API error (${res.status}): ${errText}`)
    }
    return { success: true, method: 'brevo' }
  }

  // 3. SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    console.log(`✉️ Sending email via SendGrid HTTP API to: ${to}`)
    let fromEmail = 'noreply@healthybe.com'
    let fromName = 'HealthyBe'
    const match = fromAddress.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/)
    if (match) {
      if (match[1]) fromName = match[1]
      if (match[2]) fromEmail = match[2]
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html }
        ]
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`SendGrid API error (${res.status}): ${errText}`)
    }
    return { success: true, method: 'sendgrid' }
  }

  return null
}

function handleMailError(err) {
  const isTimeout = err.message.toLowerCase().includes('timeout') || err.code === 'ETIMEDOUT'
  
  if (isTimeout) {
    console.error('\n==================================================================')
    console.error('⚠️ DETECTED SMTP CONNECTION TIMEOUT!')
    console.error('If you are running on Render Free tier, standard SMTP ports (25, 465, 587) are BLOCKED.')
    console.error('To resolve this, please configure one of the following HTTP-based API keys')
    console.error('in your Render Dashboard environment variables to send emails via HTTP (port 443):')
    console.error('- RESEND_API_KEY (Get a free key from https://resend.com)')
    console.error('- BREVO_API_KEY (Get a free key from https://brevo.com)')
    console.error('- SENDGRID_API_KEY (Get a free key from https://sendgrid.com)')
    console.error('==================================================================\n')
  }
}

async function sendOtpEmail(email, otp) {
  const subject = `HealthyBe Verification Code: ${otp}`
  const text = `Your HealthyBe verification code is: ${otp}. It is valid for 5 minutes.`
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

  try {
    // 1. Try sending via HTTP REST API (port 443) first
    const httpRes = await sendEmailViaHttp({ to: email, subject, text, html: htmlContent })
    if (httpRes) return httpRes

    // 2. Fallback to standard SMTP
    const mailClient = await getTransporter()
    let fromAddress = process.env.SMTP_FROM || '"HealthyBe" <noreply@healthybe.com>'
    if (fromAddress && !fromAddress.includes('@') && !fromAddress.includes('<') && process.env.SMTP_USER) {
      fromAddress = `"${fromAddress.replace(/"/g, '')}" <${process.env.SMTP_USER}>`
    }

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject,
      text,
      html: htmlContent
    }

    const info = await mailClient.sendMail(mailOptions)
    
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
    handleMailError(err)
    throw err
  }
}

async function sendDeleteOtpEmail(email, otp) {
  const subject = `⚠️ HealthyBe Deletion Code: ${otp}`
  const text = `Your HealthyBe account deletion code is: ${otp}. This action is permanent.`
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

  try {
    // 1. Try sending via HTTP REST API (port 443) first
    const httpRes = await sendEmailViaHttp({ to: email, subject, text, html: htmlContent })
    if (httpRes) return httpRes

    // 2. Fallback to standard SMTP
    const mailClient = await getTransporter()
    let fromAddress = process.env.SMTP_FROM || '"HealthyBe" <noreply@healthybe.com>'
    if (fromAddress && !fromAddress.includes('@') && !fromAddress.includes('<') && process.env.SMTP_USER) {
      fromAddress = `"${fromAddress.replace(/"/g, '')}" <${process.env.SMTP_USER}>`
    }

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject,
      text,
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
    handleMailError(err)
    throw err
  }
}

module.exports = {
  sendOtpEmail,
  sendDeleteOtpEmail
}
