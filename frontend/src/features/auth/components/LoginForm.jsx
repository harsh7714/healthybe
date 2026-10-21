import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from './AccountLayout'
import { useLogin } from '../hooks/useLogin'
import { ROUTES } from '@constants/routes'

export default function LoginForm() {
  const { email, setEmail, password, setPassword, error, busy, submit } = useLogin()
  return (
    <AccountLayout
      eyebrow="Welcome back"
      title="Sign in to HealthyBe"
      description="One account for your family’s health records."
      footer={
        <>
          New to HealthyBe? <Link to={ROUTES.REGISTER}>Create an account</Link>
        </>
      }
    >
      <form className="account-form" onSubmit={submit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <div className="account-label-row">
          <label htmlFor="login-password">Password</label>
          <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Enter your password"
        />
        {error && (
          <p className="account-notice" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary account-submit" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AccountLayout>
  )
}
