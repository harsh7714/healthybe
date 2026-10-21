import Icon from '@components/Icon'
import { CHAT_SUGGESTIONS } from '@constants/messages'

export default function ChatWelcome({ activeMember, onSuggestion }) {
  return (
    <div className="assistant-welcome">
      <span className="assistant-mark">
        <Icon name="spark" size={22} />
      </span>
      <p className="eyebrow">HealthyBe AI · {activeMember?.name || 'My profile'}</p>
      <h1>Hello, {activeMember?.name || 'there'}</h1>
      <p className="assistant-subtitle">What would you like help understanding today?</p>
      <div className="assistant-suggestions">
        {CHAT_SUGGESTIONS.map(item => (
          <button key={item} type="button" onClick={() => onSuggestion(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
