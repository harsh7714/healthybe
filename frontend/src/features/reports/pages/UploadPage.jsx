import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon'
import { Heading } from '@/shared/components/ui/Shared'
import { ReportList, ReportUploader } from '../components/ReportLibrary'

export default function UploadPage() {
  const { members, activeMember, activeId, reports, setReports } = useOutletContext()
  const reportCount = reports.filter(report => report.profileId === activeId).length

  return <>
    <Heading eyebrow="Family health files" title={`Welcome, ${activeMember?.name ?? 'there'} 👋`} text="Add a health file for the active profile, capture a report photo, or tidy filenames from this page."/>
    <div className="upload-dashboard-grid">
      <ReportUploader activeId={activeId} setReports={setReports}/>
      <section className="panel glass" aria-labelledby="profile-files-title">
        <div className="section-row">
          <div>
            <h2 id="profile-files-title">{activeMember?.name ?? 'Selected profile'}’s reports</h2>
            <span className="small-text">{reportCount} {reportCount === 1 ? 'file' : 'files'} in this session</span>
          </div>
          <Link className="text-btn" to="/reports">All files</Link>
        </div>
        <ReportList reports={reports} members={members} setReports={setReports} memberId={activeId}/>
      </section>
    </div>
  </>
}
