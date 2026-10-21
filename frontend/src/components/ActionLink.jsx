import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function ActionLink({ to, icon, children, primary = false }) {
  return (
    <Link className={`btn ${primary ? 'btn-primary' : 'btn-ghost'}`} to={to}>
      {icon && <Icon name={icon} size={16} />} {children}
    </Link>
  )
}
