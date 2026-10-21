import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { NAV_ITEMS } from '@constants/navigation'
import { ROUTES } from '@constants/routes'

export default function BottomNav({ user }) {
  const visibleNavItems = user ? NAV_ITEMS : NAV_ITEMS.filter(item => item.to !== ROUTES.PROFILE)
  return <nav className="mobile-nav" aria-label="Main navigation">{visibleNavItems.map(item => <NavLink key={item.to} to={item.to} end={item.to === ROUTES.HOME}><Icon name={item.icon} size={20}/><span>{item.label === 'AI assistant' ? 'AI' : item.label}</span></NavLink>)}</nav>
}
