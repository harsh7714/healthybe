import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout'
import { authApi } from '@features/auth/services/auth.api'

export default function RegisterPage() {
  const { setUser, refreshData } = useOutletContext(), navigate = useNavigate()
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { const { user } = await authApi.register({ name, email, password }); setUser(user); await refreshData(); navigate('/dashboard', { replace: true }) }
    catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <AccountLayout eyebrow="Create your account" title="One account for your family" description="Keep each family member’s health files separate under one secure sign-in." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
    <form className="account-form" onSubmit={submit}><label htmlFor="register-name">Your name</label><input id="register-name" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/><label htmlFor="register-email">Email address</label><input id="register-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/><label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 10 characters"/>{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-primary account-submit" disabled={busy} type="submit">{busy ? 'Creating account…' : 'Create account'}</button></form>
  </AccountLayout>
}
