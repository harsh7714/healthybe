import Icon from '@components/Icon'
import { reportsApi } from '../services/report.api'
import { useReportList } from '../hooks/useReportList'

const sizeLabel = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`

export default function ReportList({ reports, members, memberId = null, showMember = false }) {
  const { visible, editing, setEditing, name, setName, error, rename, remove, askAbout } = useReportList(reports, memberId)
  if (showMember && !memberId) return <div className="profile-report-groups">{members.map(member => <section className="panel glass profile-report-card" key={member.id}><div className="section-row"><div><h2>{member.name}</h2><span className="small-text">{reports.filter(report => report.profileId === member.id).length} reports</span></div></div><ReportList reports={reports} members={members} memberId={member.id}/></section>)}</div>
  if (!visible.length) return <div className="empty-copy"><p>{memberId ? 'No files for this profile yet.' : 'No files have been uploaded yet.'}</p>{memberId && <span className="small-text">Upload a health file to get started.</span>}</div>

  return <div className="report-list">{visible.map(report => {
    const member = members.find(item => item.id === report.profileId)
    const isEditing = editing === report.id
    return <article className="report-item" key={report.id}>
      <span className="file-icon"><Icon name={report.type === 'IMAGE' ? 'camera' : 'file'} size={20}/></span>
      <div className="report-meta">{isEditing ? <input className="rename-input" aria-label="File display name" value={name} maxLength={160} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') rename(report); if (event.key === 'Escape') setEditing('') }}/> : <strong>{report.name}</strong>}<span>{sizeLabel(report.size || 0)} · {report.type === 'IMAGE' ? 'Image' : 'PDF'}{showMember && member ? ` · ${member.name}` : ''}</span></div>
      {isEditing ? <><button className="text-btn" type="button" onClick={() => rename(report)}>Save</button><button className="text-btn" type="button" onClick={() => setEditing('')}>Cancel</button></> : <>
        <a className="report-icon-action" href={reportsApi.fileUrl(report.id)} target="_blank" rel="noreferrer" aria-label={`View ${report.name}`} title="View report"><Icon name="eye" size={17}/></a>
        <button className="text-btn ask-report" type="button" onClick={() => askAbout(report)}><Icon name="spark" size={14}/> Ask AI</button>
        <details className="report-actions"><summary className="report-icon-action" aria-label={`More actions for ${report.name}`} title="More actions"><Icon name="more" size={18}/></summary><div className="report-action-menu">
          <button type="button" onClick={event => { setEditing(report.id); setName(report.name); event.currentTarget.closest('details')?.removeAttribute('open') }}>Rename</button>
          <button className="danger-action" type="button" onClick={() => remove(report)}><Icon name="trash" size={15}/> Delete</button>
        </div></details>
      </>}
    </article>
  })}{error && <p className="form-error" role="alert">{error}</p>}</div>
}
