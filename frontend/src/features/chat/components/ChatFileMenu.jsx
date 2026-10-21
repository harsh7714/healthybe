import { Link } from 'react-router-dom'
import Icon from '@components/Icon'
import { ROUTES } from '@constants/routes'

export default function ChatFileMenu({
  activeMember,
  profileReports,
  reportId,
  onSelectReport,
  fileInput,
  onClose,
}) {
  return (
    <section className="assistant-file-menu glass">
      <div className="assistant-file-menu-head">
        <strong>Files for {activeMember?.name || 'selected profile'}</strong>
        <Link to={ROUTES.DASHBOARD} onClick={onClose}>
          Manage uploads
        </Link>
      </div>
      <div className="assistant-file-list">
        {profileReports.length ? (
          profileReports.map(report => (
            <button
              key={report.id}
              type="button"
              className={report.id === reportId ? 'selected' : ''}
              onClick={() => onSelectReport(report)}
            >
              <Icon name={report.type === 'IMAGE' ? 'camera' : 'file'} size={16} />
              <span>{report.name}</span>
            </button>
          ))
        ) : (
          <p>
            No reports for this profile. <Link to={ROUTES.DASHBOARD}>Upload one</Link>
          </p>
        )}
      </div>
      <button
        className="assistant-upload-action"
        type="button"
        onClick={() => fileInput.current?.click()}
      >
        <Icon name="upload" size={15} /> Upload a new file
      </button>
    </section>
  )
}
