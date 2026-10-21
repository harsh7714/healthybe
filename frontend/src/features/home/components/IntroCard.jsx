import Icon from '@components/Icon'

export default function IntroCard() {
  return <div className="hero-visual">
    <div className="orb"/>
    <div className="hero-card glass">
      <div className="hero-card-head">
        <div><span className="mini-label">Your private health space</span><div className="health-score"><Icon name="file" size={27}/></div></div>
        <span className="tag">Your control</span>
      </div>
      <div className="home-card-details"><span><Icon name="user" size={15}/> Separate family profiles</span><span><Icon name="file" size={15}/> Reports by profile</span></div>
      <div className="card-foot"><span>Private by design</span><span className="trend">Backend in progress</span></div>
    </div>
    <div className="floating-note"><span className="check"><Icon name="check" size={13}/></span> Family profiles, one account</div>
  </div>
}
