import { Link } from 'react-router-dom'
import { ROUTES } from '@constants/routes'

export default function AccountSecuritySection({ user }) {
  return <section className="account-settings-card glass">
    <div className="section-row"><div><h2>Account security</h2><span className="small-text">{user.name} · {user.email}</span></div></div>
    <div className="account-actions">
      <Link className="btn btn-ghost" to={ROUTES.FORGOT_PASSWORD}>Reset password</Link>
      <Link className="btn btn-ghost" to={ROUTES.LOGOUT}>Sign out</Link>
      <Link className="btn btn-danger" to={ROUTES.DELETE_ACCOUNT}>Delete account</Link>
    </div>
  </section>
}
