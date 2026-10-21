import { Link } from 'react-router-dom'
import { useProfiles } from '@context/ProfileContext'
import { ROUTES } from '@constants/routes'
import Heading from '@components/Heading'
import ReportList from '../components/ReportList'
import ReportUploader from '../components/ReportUploader'

export default function UploadPage() {
  const { members, activeMember, activeId, reports } = useProfiles()
  const reportCount = reports.filter(report => report.profileId === activeId).length

  return <>
    <Heading eyebrow="Family health files" title={`Welcome, ${activeMember?.name ?? 'there'} 👋`} text="Add a health file for the active profile, capture a report photo, or tidy filenames from this page."/>
    <div className="upload-dashboard-grid">
      <ReportUploader activeId={activeId}/>
      <section className="panel glass" aria-labelledby="profile-files-title">
        <div className="section-row">
          <div>
            <h2 id="profile-files-title">{activeMember?.name ?? 'Selected profile'}’s reports</h2>
            <span className="small-text">{reportCount} {reportCount === 1 ? 'file' : 'files'} in this session</span>
          </div>
          <Link className="text-btn" to={ROUTES.REPORTS}>All files</Link>
        </div>
        <ReportList reports={reports} members={members} memberId={activeId}/>
      </section>
    </div>
  </>
}
