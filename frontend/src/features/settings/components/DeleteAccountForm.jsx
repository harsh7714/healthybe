import React from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from '@features/auth/components/AccountLayout'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { ROUTES } from '@constants/routes'

export default function DeleteAccountForm() {
  const { confirmation, setConfirmation, password, setPassword, error, busy, submit } = useDeleteAccount()
  return <AccountLayout eyebrow="Danger zone" title="Delete account" description="Permanently removes your sign-in, family profiles, stored reports, and chat history. This cannot be undone." footer={<Link to={ROUTES.PROFILE}>Cancel and return to settings</Link>}><div className="delete-warning"><strong>This action cannot be undone.</strong></div><form className="account-form" onSubmit={submit}><label htmlFor="delete-password">Confirm your password</label><input id="delete-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/><label htmlFor="delete-confirmation">Type DELETE to confirm</label><input id="delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" required/>{error && <p className="account-notice" role="alert">{error}</p>}<button className="btn btn-danger account-submit" disabled={busy || confirmation !== 'DELETE'} type="submit">{busy ? 'Deleting…' : 'Delete account permanently'}</button></form></AccountLayout>
}
