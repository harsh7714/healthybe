import ActionLink from '@components/ActionLink'
import { ROUTES } from '@constants/routes'

export default function HomeCallToAction() {
  return (
    <section className="home-bottom glass">
      <div>
        <span className="eyebrow">Start with your family</span>
        <h2>Set up your profiles.</h2>
        <p className="muted">
          Add or remove local profile entries from Profile. Account sync will arrive with backend
          integration.
        </p>
      </div>
      <ActionLink to={ROUTES.PROFILE} icon="arrow" primary>
        Manage profiles
      </ActionLink>
    </section>
  )
}
