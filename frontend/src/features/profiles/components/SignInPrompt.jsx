import { Link } from 'react-router-dom'
import { ROUTES } from '@constants/routes'

export default function SignInPrompt() {
  return (
    <section className="profile-card glass">
      <h2>Sign in to sync your family</h2>
      <p className="small-text">Profiles and health files are private to your account.</p>
      <div className="account-actions">
        <Link className="btn btn-primary" to={ROUTES.LOGIN}>
          Sign in
        </Link>
        <Link className="btn btn-ghost" to={ROUTES.REGISTER}>
          Create account
        </Link>
      </div>
    </section>
  )
}
