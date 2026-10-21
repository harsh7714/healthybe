import Icon from '@components/Icon'

export default function FamilyProfilesSection({
  members,
  user,
  activeId,
  name,
  setName,
  relation,
  setRelation,
  error,
  busy,
  onAdd,
  onRemove,
}) {
  return (
    <section className="profile-card glass">
      <div className="section-row">
        <div>
          <h2>Family profiles</h2>
          <span className="small-text">
            {members.length} profiles · signed in as {user?.email || 'guest'}
          </span>
        </div>
      </div>
      <div className="family-list">
        {members.map(member => (
          <div className="family-row" key={member.id}>
            <span className="avatar mint">{member.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{member.name}</strong>
              <div className="small-text">
                {member.relation}
                {member.id === 'self' ? ' · Account owner' : ''}
                {member.id === activeId ? ' · Selected' : ''}
              </div>
            </div>
            {member.id !== 'self' && (
              <button
                className="remove-profile"
                type="button"
                onClick={() => onRemove(member)}
                aria-label={`Delete ${member.name}`}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      {user && (
        <form className="add-member-form" onSubmit={onAdd}>
          <h3>Add a family member</h3>
          <label htmlFor="member-name">Name</label>
          <input
            id="member-name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. Priya"
            maxLength={80}
            required
          />
          <label htmlFor="member-relation">Relationship</label>
          <select
            id="member-relation"
            value={relation}
            onChange={event => setRelation(event.target.value)}
          >
            <option>Family member</option>
            <option>Partner</option>
            <option>Parent</option>
            <option>Child</option>
            <option>Sibling</option>
            <option>Other</option>
          </select>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy} type="submit">
            <Icon name="plus" size={16} /> Add profile
          </button>
        </form>
      )}
    </section>
  )
}
