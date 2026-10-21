import Feature from '@components/Feature'

export default function EssentialsSection() {
  return (
    <section>
      <div className="section-row">
        <div>
          <span className="eyebrow">Simple essentials</span>
          <h2>Made for everyday health</h2>
        </div>
      </div>
      <div className="feature-grid">
        <Feature
          icon="user"
          title="Family profiles"
          text="Keep each person’s information separate and easy to switch between."
        />
        <Feature
          icon="file"
          title="A report vault"
          text="Choose a report or photo from your device and organise it by profile."
        />
        <Feature
          icon="spark"
          title="Health questions"
          text="A dedicated Gemini health assistant is planned for the backend phase."
        />
      </div>
    </section>
  )
}
