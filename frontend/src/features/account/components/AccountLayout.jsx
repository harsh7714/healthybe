import React from 'react'
import { Link } from 'react-router-dom'

export default function AccountLayout({ eyebrow, title, description, children, footer }) {
  return <div className="account-page">
    <section className="account-card glass">
      <Link className="account-wordmark" to="/" aria-label="HealthyBe home"><span>Healthy</span><span>Be</span></Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="account-description">{description}</p>
      {children}
      {footer && <div className="account-footer">{footer}</div>}
    </section>
  </div>
}
