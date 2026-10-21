import Icon from './Icon'

export default function Feature({ icon, title, text }) {
  return (
    <div className="feature-card glass">
      <div className="feature-icon">
        <Icon name={icon} size={23} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
