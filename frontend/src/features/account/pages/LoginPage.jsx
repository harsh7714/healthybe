import React, { useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout'
import { authApi } from '@features/auth/services/auth.api'

export default function LoginPage() {
  const { setUser, refreshData } = useOutletContext(), navigate = useNavigate(), location = useLocation()
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { const { user } = await authApi.login({ email, password }); setUser(user); await refreshData(); navigate(location.state?.from || '/dashboard', { replace: true }) }
    catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <AccountLayout eyebrow="Welcome back" title="Sign in to HealthyBe" description="One account for your family’s health records." footer={<>New to HealthyBe? <Link to="/register">Create an account</Link></>}>
    <form className="account-form" onSubmit={submit}><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/><div className="account-label-row"><label htmlFor="login-password">Password</label><Link to="/forgot-password">Forgot password?</Link></div><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password"/>{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-primary account-submit" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button></form>
  </AccountLayout>
}
