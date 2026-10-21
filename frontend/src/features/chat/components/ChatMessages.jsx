import FormattedAnswer from './FormattedAnswer'

export default function ChatMessages({ messages, busy, error, bottomRef }) {
  return (
    <div className="assistant-messages">
      {messages.map((message, index) => (
        <article
          className={`assistant-message ${message.sender}`}
          key={`${index}-${message.sender}`}
        >
          <span className="assistant-message-label">
            {message.sender === 'user' ? 'You' : 'HealthyBe AI'}
          </span>
          {message.sender === 'ai' ? (
            <FormattedAnswer text={message.text} />
          ) : (
            <p>{message.text}</p>
          )}
        </article>
      ))}
      {busy && (
        <p className="assistant-typing" role="status">
          HealthyBe AI is thinking…
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
