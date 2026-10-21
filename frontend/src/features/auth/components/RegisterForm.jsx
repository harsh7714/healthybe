import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from './AccountLayout'
import { useRegister } from '../hooks/useRegister'
import { ROUTES } from '@constants/routes'

export default function RegisterForm() {
  const { name, setName, email, setEmail, password, setPassword, error, busy, submit } = useRegister()
  return <AccountLayout eyebrow="Create your account" title="One account for your family" description="Keep each family member’s health files separate under one secure sign-in." footer={<>Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link></>}>
    <form className="account-form" onSubmit={submit}><label htmlFor="register-name">Your name</label><input id="register-name" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/><label htmlFor="register-email">Email address</label><input id="register-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/><label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 10 characters"/>{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-primary account-submit" disabled={busy} type="submit">{busy ? 'Creating account…' : 'Create account'}</button></form>
  </AccountLayout>
}
