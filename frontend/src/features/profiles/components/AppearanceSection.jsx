import Icon from '@components/Icon'

export default function AppearanceSection({ dark, setDark }) {
  return <section className="profile-card glass">
    <div className="section-row"><div><h2>Appearance</h2><span className="small-text">Choose how HealthyBe looks on this device.</span></div></div>
    <div className="setting-row">
      <div><strong>{dark ? 'Dark theme' : 'Light theme'}</strong><div className="small-text">Saved in this browser.</div></div>
      <button className="icon-btn" type="button" aria-label="Toggle appearance" onClick={() => setDark(!dark)}><Icon name={dark ? 'sun' : 'moon'} size={17}/></button>
    </div>
  </section>
}
