import React from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

export function MemberBar({ members, activeId, setActiveId }) {
  return <div className="member-strip" aria-label="Choose family profile">
    {members.map(member => <button
      type="button"
      key={member.id}
      aria-pressed={activeId === member.id}
      className={`member-pill ${activeId === member.id ? 'active' : ''}`}
      onClick={() => setActiveId(member.id)}
    >
      <span className={`avatar ${member.color ?? 'mint'}`}>{member.name.slice(0, 1).toUpperCase()}</span>
      {member.name}<span className="small-text">· {member.relation}</span>
    </button>)}
  </div>
}

export function Heading({ eyebrow, title, text, children }) {
  return <div className="page-heading">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>
    {children}
  </div>
}

export function Feature({ icon, title, text }) {
  return <div className="feature-card glass">
    <div className="feature-icon"><Icon name={icon} size={23}/></div>
    <h3>{title}</h3><p>{text}</p>
  </div>
}

export function ActionLink({ to, icon, children, primary = false }) {
  return <Link className={`btn ${primary ? 'btn-primary' : 'btn-ghost'}`} to={to}>
    {icon && <Icon name={icon} size={16}/>} {children}
  </Link>
}
