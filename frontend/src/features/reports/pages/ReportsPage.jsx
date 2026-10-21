import { useProfiles } from '@context/useProfiles'
import ReportList from '../components/ReportList'
import Heading from '@components/Heading'

export default function ReportsPage() {
  const { reports, members, activeMember, activeId } = useProfiles()
  const profileReports = reports.filter(report => report.profileId === activeId)

  return (
    <>
      <Heading
        eyebrow="Family health vault"
        title={`Hi ${activeMember?.name ?? 'there'} 👋`}
        text={`Here are ${activeMember?.name ?? 'your profile'}’s health reports. Select Ask AI to attach a report to a health question.`}
      />
      <section className="panel glass all-reports-panel">
        <div className="section-row">
          <div>
            <h2>{activeMember?.name ?? 'Selected profile'}’s reports</h2>
            <span className="small-text">
              {profileReports.length} {profileReports.length === 1 ? 'file' : 'files'} in this
              session
            </span>
          </div>
        </div>
        <ReportList reports={reports} members={members} memberId={activeId} />
      </section>
    </>
  )
}
