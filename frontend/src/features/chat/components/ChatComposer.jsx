import Icon from '@components/Icon'
import { HEALTH_INFORMATION_DISCLAIMER } from '@constants/messages'

export default function ChatComposer({
  fileInput,
  cameraInput,
  question,
  setQuestion,
  photo,
  selectedReport,
  openFiles,
  setOpenFiles,
  busy,
  onPhotoChange,
  onRemoveAttachment,
  onSend,
  children,
}) {
  return (
    <div className="assistant-composer-wrap">
      {children}
      {(photo || selectedReport) && (
        <div className="assistant-attachment">
          <Icon
            name={
              (photo?.type || selectedReport?.mimeType || '').startsWith('image/')
                ? 'camera'
                : 'file'
            }
            size={15}
          />
          <span>{photo?.name || selectedReport?.name}</span>
          <button className="text-btn" type="button" onClick={onRemoveAttachment}>
            Remove
          </button>
        </div>
      )}
      <form className="assistant-composer" onSubmit={onSend}>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={onPhotoChange}
        />
        <input
          ref={cameraInput}
          className="visually-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhotoChange}
        />
        <button
          className="attach"
          type="button"
          aria-label="Choose a report"
          aria-expanded={openFiles}
          onClick={() => setOpenFiles(value => !value)}
        >
          <Icon name="file" size={19} />
        </button>
        <button
          className="attach"
          type="button"
          aria-label="Take a report photo"
          onClick={() => cameraInput.current?.click()}
        >
          <Icon name="camera" size={19} />
        </button>
        <input
          value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder="Ask a health question…"
          aria-label="Ask a health question"
        />
        <button
          className="send"
          type="submit"
          aria-label="Send question"
          disabled={busy || (!question.trim() && !photo && !selectedReport)}
        >
          <Icon name="send" size={18} />
        </button>
      </form>
      <p className="assistant-note">{HEALTH_INFORMATION_DISCLAIMER}</p>
    </div>
  )
}
