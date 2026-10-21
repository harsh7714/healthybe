import { Link, NavLink } from 'react-router-dom'
import Icon from '@components/Icon'
import { NAV_ITEMS } from '@constants/navigation'
import { ROUTES } from '@constants/routes'

export default function Navbar({
  dark,
  setDark,
  activeMember,
  members = [],
  activeId,
  setActiveId,
  user,
}) {
  const initials = activeMember?.name?.slice(0, 1).toUpperCase() ?? 'H'
  const visibleNavItems = user ? NAV_ITEMS : NAV_ITEMS.filter(item => item.to !== ROUTES.PROFILE)

  return (
    <header className="topbar">
      <Link className="brand" to={ROUTES.HOME} aria-label="HealthyBe home">
        <span className="brand-mark">
          <img className="brand-logo" src="/favicon.ico" alt="" />
        </span>
        <span className="brand-word">
          <span>Healthy</span>
          <span>Be</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {visibleNavItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === ROUTES.HOME}>
            <Icon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="top-actions">
        <button
          className="icon-btn"
          type="button"
          aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
          onClick={() => setDark(!dark)}
        >
          <Icon name={dark ? 'sun' : 'moon'} size={18} />
        </button>
        {user ? (
          <details className="profile-switcher">
            <summary
              className="profile-chip"
              aria-label={`Switch profile. Current profile: ${activeMember?.name ?? 'you'}`}
            >
              <span className="avatar small mint">{initials}</span>
              <span>{activeMember?.name ?? 'Profile'}</span>
            </summary>
            <div className="profile-menu" role="group" aria-label="Choose active profile">
              <span className="eyebrow">Switch profile</span>
              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  className={`profile-option ${member.id === activeId ? 'selected' : ''}`}
                  aria-pressed={member.id === activeId}
                  onClick={() => {
                    setActiveId(member.id)
                    document.activeElement?.closest('details')?.removeAttribute('open')
                  }}
                >
                  <span className={`avatar small ${member.color ?? 'mint'}`}>
                    {member.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    {member.name}
                    <small>{member.relation}</small>
                  </span>
                  {member.id === activeId && (
                    <span className="profile-check" aria-label="Selected">
                      ✓
                    </span>
                  )}
                </button>
              ))}
              <Link className="profile-manage" to={ROUTES.PROFILE}>
                Manage family profiles
              </Link>
            </div>
          </details>
        ) : (
          <Link className="btn btn-ghost sign-in-link" to={ROUTES.LOGIN}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
