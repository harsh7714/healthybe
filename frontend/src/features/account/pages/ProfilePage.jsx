import React, { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon'
import { Heading } from '@/shared/components/ui/Shared'

export default function ProfilePage() {
  const { dark, setDark, members, activeId, user, addProfile, deleteProfile } = useOutletContext()
  const [name, setName] = useState(''), [relation, setRelation] = useState('Family member'), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function add(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await addProfile({ name: name.trim(), relation }); setName('') } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  async function remove(profile) {
    if (!window.confirm(`Delete ${profile.name}'s profile and reports? This cannot be undone.`)) return
    try { await deleteProfile(profile.id) } catch (problem) { setError(problem.message) }
  }
  return <><Heading eyebrow="Account & preferences" title="Profile & settings" text="Manage one account and private health spaces for each family member."/>
    {!user && <section className="profile-card glass"><h2>Sign in to sync your family</h2><p className="small-text">Profiles and health files are private to your account.</p><div className="account-actions"><Link className="btn btn-primary" to="/login">Sign in</Link><Link className="btn btn-ghost" to="/register">Create account</Link></div></section>}
    <div className="profile-grid"><section className="profile-card glass"><div className="section-row"><div><h2>Family profiles</h2><span className="small-text">{members.length} profiles · signed in as {user?.email || 'guest'}</span></div></div><div className="family-list">{members.map(member => <div className="family-row" key={member.id}><span className="avatar mint">{member.name.slice(0,1).toUpperCase()}</span><div><strong>{member.name}</strong><div className="small-text">{member.relation}{member.id === 'self' ? ' · Account owner' : ''}{member.id === activeId ? ' · Selected' : ''}</div></div>{member.id !== 'self' && <button className="remove-profile" type="button" onClick={() => remove(member)} aria-label={`Delete ${member.name}`}><Icon name="close" size={16}/></button>}</div>)}</div>
      {user && <form className="add-member-form" onSubmit={add}><h3>Add a family member</h3><label htmlFor="member-name">Name</label><input id="member-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Priya" maxLength={80} required/><label htmlFor="member-relation">Relationship</label><select id="member-relation" value={relation} onChange={event => setRelation(event.target.value)}><option>Family member</option><option>Partner</option><option>Parent</option><option>Child</option><option>Sibling</option><option>Other</option></select>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy} type="submit"><Icon name="plus" size={16}/> Add profile</button></form>}</section>
    <section className="profile-card glass"><div className="section-row"><div><h2>Appearance</h2><span className="small-text">Choose how HealthyBe looks on this device.</span></div></div><div className="setting-row"><div><strong>{dark ? 'Dark theme' : 'Light theme'}</strong><div className="small-text">Saved in this browser.</div></div><button className="icon-btn" type="button" aria-label="Toggle appearance" onClick={() => setDark(!dark)}><Icon name={dark ? 'sun' : 'moon'} size={17}/></button></div></section></div>
    {user && <section className="account-settings-card glass"><div className="section-row"><div><h2>Account security</h2><span className="small-text">{user.name} · {user.email}</span></div></div><div className="account-actions"><Link className="btn btn-ghost" to="/forgot-password">Reset password</Link><Link className="btn btn-ghost" to="/logout">Sign out</Link><Link className="btn btn-danger" to="/delete-account">Delete account</Link></div></section>}
  </>
}
