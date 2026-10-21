import React from 'react'
import Icon from '@components/Icon'
import ActionLink from '@components/ActionLink'
import Feature from '@components/Feature'

function IntroCard() {
  return <div className="hero-visual">
    <div className="orb"/>
    <div className="hero-card glass">
      <div className="hero-card-head">
        <div>
          <span className="mini-label">Your private health space</span>
          <div className="health-score"><Icon name="file" size={27}/></div>
        </div>
        <span className="tag">Your control</span>
      </div>
      <div className="home-card-details"><span><Icon name="user" size={15}/> Separate family profiles</span><span><Icon name="file" size={15}/> Reports by profile</span></div>
      <div className="card-foot"><span>Private by design</span><span className="trend">Backend in progress</span></div>
    </div>
    <div className="floating-note"><span className="check"><Icon name="check" size={13}/></span> Family profiles, one account</div>
  </div>
}

export default function HomePage() {
  return <>
    <section className="hero">
      <div>
        <span className="eyebrow">A clearer way to manage family health</span>
        <h1>Your health,<br/><em>all together.</em></h1>
        <p>Keep health reports and family profiles in one place. Healthybe is being rebuilt so you can manage your family’s health in one simple space.</p>
        <div className="hero-actions">
          <ActionLink to="/reports" icon="file" primary>Open reports</ActionLink>
          <ActionLink to="/profile" icon="user">Manage profiles</ActionLink>
        </div>
      </div>
      <IntroCard/>
    </section>
    <section>
      <div className="section-row"><div><span className="eyebrow">Simple essentials</span><h2>Made for everyday health</h2></div></div>
      <div className="feature-grid">
        <Feature icon="user" title="Family profiles" text="Keep each person’s information separate and easy to switch between."/>
        <Feature icon="file" title="A report vault" text="Choose a report or photo from your device and organise it by profile."/>
        <Feature icon="spark" title="Health questions" text="A dedicated Gemini health assistant is planned for the backend phase."/>
      </div>
    </section>
    <section className="home-bottom glass">
      <div><span className="eyebrow">Start with your family</span><h2>Set up your profiles.</h2><p className="muted">Add or remove local profile entries from Profile. Account sync will arrive with backend integration.</p></div>
      <ActionLink to="/profile" icon="arrow" primary>Manage profiles</ActionLink>
    </section>
  </>
}
