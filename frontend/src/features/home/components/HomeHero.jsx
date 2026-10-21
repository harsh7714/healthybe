import ActionLink from '@components/ActionLink'
import { ROUTES } from '@constants/routes'
import IntroCard from './IntroCard'

export default function HomeHero() {
  return (
    <section className="hero">
      <div>
        <span className="eyebrow">A clearer way to manage family health</span>
        <h1>
          Your health,
          <br />
          <em>all together.</em>
        </h1>
        <p>
          Keep health reports and family profiles in one place. Healthybe is being rebuilt so you
          can manage your family’s health in one simple space.
        </p>
        <div className="hero-actions">
          <ActionLink to={ROUTES.REPORTS} icon="file" primary>
            Open reports
          </ActionLink>
          <ActionLink to={ROUTES.PROFILE} icon="user">
            Manage profiles
          </ActionLink>
        </div>
      </div>
      <IntroCard />
    </section>
  )
}
