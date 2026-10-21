import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from './AccountLayout'
import { usePasswordReset } from '../hooks/usePasswordReset'
import { ROUTES } from '@constants/routes'

export default function PasswordResetForm() {
  const { email, setEmail, code, setCode, password, setPassword, stage, notice, error, submit } = usePasswordReset()
  return <AccountLayout eyebrow="Account recovery" title="Reset your password" description="Verify your email, then choose a new password." footer={<Link to={ROUTES.LOGIN}>Back to sign in</Link>}><form className="account-form" onSubmit={submit}><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" autoComplete="email" required disabled={stage > 0} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>{stage > 0 && stage < 2 && <><label htmlFor="reset-code">Email verification code</label><input id="reset-code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={event => setCode(event.target.value)} placeholder="6-digit code"/><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 10 characters"/></>}{notice && <p className="account-notice" role="status">{notice}</p>}{error && <p className="account-notice" role="alert">{error}</p>}{stage < 2 && <button className="btn btn-primary account-submit" type="submit">{stage ? 'Set new password' : 'Send verification code'}</button>}</form></AccountLayout>
}
