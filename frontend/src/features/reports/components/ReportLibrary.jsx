import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon'
import { reportsApi } from '@/services/api'

const sizeLabel = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`

export function ReportUploader({ activeId, setReports }) {
  const browse = useRef(null), camera = useRef(null)
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  async function addFiles(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setBusy(true); setNotice('')
    try {
      const uploaded = await Promise.all(files.map(file => reportsApi.upload(file, activeId)))
      setReports(current => [...uploaded, ...current])
      const location = uploaded.some(report => report.storage === 'local') ? 'local development storage' : 'cloud storage'
      setNotice(`${uploaded.length} ${uploaded.length === 1 ? 'file' : 'files'} uploaded to ${location}.`)
    } catch (error) { setNotice(error.message) } finally { setBusy(false) }
  }
  return <section className="upload-zone glass" aria-labelledby="upload-title">
    <input ref={browse} className="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={addFiles}/>
    <input ref={camera} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={addFiles}/>
    <div className="upload-icon"><Icon name="upload" size={22}/></div><span className="eyebrow">Add to selected profile</span>
    <h2 id="upload-title">Upload a health file</h2><p className="muted">PDF or report photos. Files are stored without automatic AI analysis.</p>
    <div className="upload-actions"><button className="btn btn-primary" disabled={busy} type="button" onClick={() => camera.current?.click()}><Icon name="camera" size={16}/> Take photo</button><button className="btn btn-ghost" disabled={busy} type="button" onClick={() => browse.current?.click()}><Icon name="file" size={16}/> Browse files</button></div>
    {busy && <span className="small-text" role="status">Uploading securely…</span>}{notice && <span className={notice.includes('uploaded') ? 'small-text' : 'form-error'} role="status">{notice}</span>}
  </section>
}

export function ReportList({ reports, members, setReports, memberId = null, showMember = false }) {
  const navigate = useNavigate(), [editing, setEditing] = useState(''), [name, setName] = useState(''), [error, setError] = useState('')
  const visible = reports.filter(report => !memberId || report.profileId === memberId)
  async function rename(report) {
    try { const updated = await reportsApi.rename(report.id, name); setReports(current => current.map(item => item.id === report.id ? updated : item)); setEditing(''); setError('') }
    catch (problem) { setError(problem.message) }
  }
  async function remove(report) {
    const confirmed = window.confirm(`Delete “${report.name}” from this profile? This cannot be undone.`)
    if (!confirmed) return
    try { await reportsApi.remove(report.id); setReports(current => current.filter(item => item.id !== report.id)) }
    catch (problem) { setError(problem.message) }
  }
  if (showMember && !memberId) return <div className="profile-report-groups">{members.map(member => <section className="panel glass profile-report-card" key={member.id}><div className="section-row"><div><h2>{member.name}</h2><span className="small-text">{reports.filter(report => report.profileId === member.id).length} reports</span></div></div><ReportList reports={reports} members={members} setReports={setReports} memberId={member.id}/></section>)}</div>
  if (!visible.length) return <div className="empty-copy"><p>{memberId ? 'No files for this profile yet.' : 'No files have been uploaded yet.'}</p>{memberId && <span className="small-text">Upload a health file to get started.</span>}</div>
  return <div className="report-list">{visible.map(report => {
    const member = members.find(item => item.id === report.profileId), isEditing = editing === report.id
    return <article className="report-item" key={report.id}>
      <span className="file-icon"><Icon name={report.type === 'IMAGE' ? 'camera' : 'file'} size={20}/></span>
      <div className="report-meta">{isEditing ? <input className="rename-input" aria-label="File display name" value={name} maxLength={160} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') rename(report); if (event.key === 'Escape') setEditing('') }}/> : <strong>{report.name}</strong>}<span>{sizeLabel(report.size || 0)} · {report.type === 'IMAGE' ? 'Image' : 'PDF'}{showMember && member ? ` · ${member.name}` : ''}</span></div>
      {isEditing ? <><button className="text-btn" type="button" onClick={() => rename(report)}>Save</button><button className="text-btn" type="button" onClick={() => setEditing('')}>Cancel</button></> : <>
        <a className="report-icon-action" href={report.fileUrl} target="_blank" rel="noreferrer" aria-label={`View ${report.name}`} title="View report"><Icon name="eye" size={17}/></a>
        <button className="text-btn ask-report" type="button" onClick={() => navigate('/chat', { state: { reportId: report.id, fileName: report.name, profileId: report.profileId } })}><Icon name="spark" size={14}/> Ask AI</button>
        <details className="report-actions"><summary className="report-icon-action" aria-label={`More actions for ${report.name}`} title="More actions"><Icon name="more" size={18}/></summary><div className="report-action-menu">
          <button type="button" onClick={event => { setEditing(report.id); setName(report.name); event.currentTarget.closest('details')?.removeAttribute('open') }}>Rename</button>
          <button className="danger-action" type="button" onClick={() => remove(report)}><Icon name="trash" size={15}/> Delete</button>
        </div></details>
      </>}
    </article>
  })}{error && <p className="form-error" role="alert">{error}</p>}</div>
}
