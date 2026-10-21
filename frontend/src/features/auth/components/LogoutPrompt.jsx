import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from './AccountLayout'
import { useLogout } from '../hooks/useLogout'
import { ROUTES } from '@constants/routes'

export default function LogoutPrompt() {
  const { error, busy, signOut } = useLogout()
  return <AccountLayout eyebrow="Account session" title="Sign out" description="Sign out of your HealthyBe account on this device." footer={<Link to={ROUTES.PROFILE}>Return to profile settings</Link>}><div className="account-form">{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-primary account-submit" disabled={busy} type="button" onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button></div></AccountLayout>
}
