import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import AccountLayout from '../components/AccountLayout'
import { authApi } from '@/services/api'

export default function LogoutPage() {
  const { setUser, setReports, setMembers } = useOutletContext(), navigate = useNavigate()
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function signOut() {
    setBusy(true); setError('')
    try { await authApi.logout(); setUser(null); setReports([]); setMembers([]); navigate('/login', { replace: true }) }
    catch (problem) { setError(problem.message); setBusy(false) }
  }
  return <AccountLayout eyebrow="Account session" title="Sign out" description="Sign out of your HealthyBe account on this device." footer={<Link to="/profile">Return to profile settings</Link>}><div className="account-form">{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-primary account-submit" disabled={busy} type="button" onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button></div></AccountLayout>
}
