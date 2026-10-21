import { useChat } from '../hooks/useChat'
import ChatWelcome from '../components/ChatWelcome'
import ChatMessages from '../components/ChatMessages'
import ChatFileMenu from '../components/ChatFileMenu'
import ChatComposer from '../components/ChatComposer'

export default function ChatPage() {
  const chat = useChat()

  return (
    <div className="chat-screen">
      <section className="assistant-conversation" aria-label="Conversation">
        {!chat.messages.length ? (
          <ChatWelcome activeMember={chat.activeMember} onSuggestion={chat.setQuestion} />
        ) : (
          <ChatMessages
            messages={chat.messages}
            busy={chat.busy}
            error={chat.error}
            bottomRef={chat.bottom}
          />
        )}
      </section>
      <ChatComposer
        fileInput={chat.fileInput}
        cameraInput={chat.cameraInput}
        question={chat.question}
        setQuestion={chat.setQuestion}
        photo={chat.photo}
        selectedReport={chat.selectedReport}
        openFiles={chat.openFiles}
        setOpenFiles={chat.setOpenFiles}
        busy={chat.busy}
        onPhotoChange={chat.selectPhoto}
        onRemoveAttachment={chat.removeAttachment}
        onSend={chat.send}
      >
        {chat.openFiles && (
          <ChatFileMenu
            activeMember={chat.activeMember}
            profileReports={chat.profileReports}
            reportId={chat.reportId}
            onSelectReport={chat.selectReport}
            fileInput={chat.fileInput}
            onClose={() => chat.setOpenFiles(false)}
          />
        )}
      </ChatComposer>
    </div>
  )
}
