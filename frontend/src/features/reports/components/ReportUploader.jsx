import { useRef } from 'react'
import Icon from '@components/Icon'
import { useReportUpload } from '../hooks/useReportUpload'

export default function ReportUploader({ activeId }) {
  const browse = useRef(null)
  const camera = useRef(null)
  const { busy, notice, addFiles } = useReportUpload(activeId)

  return <section className="upload-zone glass" aria-labelledby="upload-title">
    <input ref={browse} className="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={addFiles}/>
    <input ref={camera} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={addFiles}/>
    <div className="upload-icon"><Icon name="upload" size={22}/></div><span className="eyebrow">Add to selected profile</span>
    <h2 id="upload-title">Upload a health file</h2><p className="muted">PDF or report photos. Files are stored without automatic AI analysis.</p>
    <div className="upload-actions"><button className="btn btn-primary" disabled={busy} type="button" onClick={() => camera.current?.click()}><Icon name="camera" size={16}/> Take photo</button><button className="btn btn-ghost" disabled={busy} type="button" onClick={() => browse.current?.click()}><Icon name="file" size={16}/> Browse files</button></div>
    {busy && <span className="small-text" role="status">Uploading securely…</span>}{notice && <span className={notice.includes('uploaded') ? 'small-text' : 'form-error'} role="status">{notice}</span>}
  </section>
}
