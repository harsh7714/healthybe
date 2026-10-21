export default function SavedChatsSection({ onClear, notice }) {
  return (
    <section className="profile-card glass chat-storage-setting">
      <div className="section-row">
        <div>
          <h2>Saved AI chats</h2>
          <span className="small-text">
            Conversations are stored only in this browser, separately for each profile.
          </span>
        </div>
      </div>
      <div className="setting-row">
        <div>
          <strong>Local chat history</strong>
          <div className="small-text">
            Remove all saved HealthyBe AI conversations from this device.
          </div>
        </div>
        <button className="btn btn-danger" type="button" onClick={onClear}>
          Delete saved chats
        </button>
      </div>
      {notice && (
        <p className="chat-storage-notice" role="status">
          {notice}
        </p>
      )}
    </section>
  )
}
