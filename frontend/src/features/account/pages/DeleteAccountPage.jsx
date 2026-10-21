import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import AccountLayout from '@features/auth/components/AccountLayout'
import { authApi } from '@features/auth/services/auth.api'

export default function DeleteAccountPage() {
  const { setUser, setReports, setMembers } = useOutletContext(), navigate = useNavigate()
  const [confirmation, setConfirmation] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { await authApi.deleteAccount({ confirmation, password }); setUser(null); setReports([]); setMembers([]); navigate('/register', { replace: true }) }
    catch (problem) { setError(problem.message); setBusy(false) }
  }
  return <AccountLayout eyebrow="Danger zone" title="Delete account" description="Permanently removes your sign-in, family profiles, stored reports, and chat history. This cannot be undone." footer={<Link to="/profile">Cancel and return to settings</Link>}><div className="delete-warning"><strong>This action cannot be undone.</strong></div><form className="account-form" onSubmit={submit}><label htmlFor="delete-password">Confirm your password</label><input id="delete-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/><label htmlFor="delete-confirmation">Type DELETE to confirm</label><input id="delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" required/>{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-danger account-submit" disabled={busy || confirmation !== 'DELETE'} type="submit">{busy ? 'Deleting…' : 'Delete account permanently'}</button></form></AccountLayout>
}
