import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import Icon from '@/shared/components/ui/Icon'
import { chatApi } from '@/services/api'

function formatInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part)
}

function FormattedAnswer({ text }) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const blocks = []
  lines.forEach((line, index) => {
    const clean = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '').trim()
    const isMarkedHeading = /^#{1,4}\s/.test(line) || /^\*\*.+\*\*:?$/.test(line)
    const nextLine = lines[index + 1] || ''
    const isShortHeading = clean.length > 2 && clean.length < 58 && !/[.!?]$/.test(clean) && /:$/.test(clean)
    const isBullet = /^([-*•]|\d+[.)])\s+/.test(line)
    if (isBullet) {
      const previous = blocks[blocks.length - 1]
      if (previous?.type === 'list') previous.items.push(line.replace(/^([-*•]|\d+[.)])\s+/, ''))
      else blocks.push({ type: 'list', items: [line.replace(/^([-*•]|\d+[.)])\s+/, '')] })
    } else if (isMarkedHeading || isShortHeading || (clean.length < 46 && !/[.!?]$/.test(clean) && nextLine && /^([-*•]|\d+[.)])\s+/.test(nextLine))) {
      blocks.push({ type: 'heading', text: clean.replace(/:$/, '') })
    } else {
      const previous = blocks[blocks.length - 1]
      if (previous?.type === 'paragraph') previous.text += ` ${line}`
      else blocks.push({ type: 'paragraph', text: line })
    }
  })
  return <div className="assistant-answer">{blocks.map((block, index) => {
    if (block.type === 'heading') return <h3 className={`answer-heading tone-${index % 4}`} key={index}>{formatInline(block.text)}</h3>
    if (block.type === 'list') return <div className="answer-items" key={index}>{block.items.map((item, itemIndex) => <div className="answer-item" key={itemIndex}><span aria-hidden="true">{itemIndex + 1}</span><p>{formatInline(item)}</p></div>)}</div>
    return <p className={`answer-paragraph tone-${index % 4}`} key={index}>{formatInline(block.text)}</p>
  })}</div>
}

export default function ChatPage() {
  const { activeMember, activeId, reports } = useOutletContext()
  const location = useLocation()
  const fileInput = useRef(null), cameraInput = useRef(null), bottom = useRef(null)
  const [messages, setMessages] = useState([]), [question, setQuestion] = useState('')
  const [reportId, setReportId] = useState(location.state?.reportId || '')
  const [photo, setPhoto] = useState(null), [openFiles, setOpenFiles] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const activeProfileRef = useRef(activeId)
  const previousProfileRef = useRef(activeId)
  activeProfileRef.current = activeId
  const profileReports = reports.filter(report => report.profileId === activeId)
  const chatKey = `healthybe-chat-${activeId || 'self'}`
  const selectedReport = profileReports.find(report => report.id === reportId)
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  useEffect(() => {
    if (previousProfileRef.current === activeId) return
    previousProfileRef.current = activeId
    try { setMessages(JSON.parse(localStorage.getItem(`healthybe-chat-${activeId || 'self'}`) || '[]')) } catch { setMessages([]) }
    setReportId(''); setPhoto(null); setError('')
  }, [activeId])

  useEffect(() => {
    try { setMessages(JSON.parse(localStorage.getItem(chatKey) || '[]')) } catch { setMessages([]) }
  }, [])

  function updateMessages(next) {
    setMessages(current => {
      const value = typeof next === 'function' ? next(current) : next
      try { localStorage.setItem(`healthybe-chat-${activeProfileRef.current || 'self'}`, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
      return value
    })
  }

  async function send(event) {
    event?.preventDefault()
    if (busy || (!question.trim() && !photo && !selectedReport)) return
    const prompt = question.trim()
    const sentProfileId = activeId
    const attachment = photo
    const attachedReportId = selectedReport?.id
    const userEntry = { sender: 'user', text: prompt || `Please explain ${attachment?.name || selectedReport?.name}.` }
    updateMessages(current => [...current, userEntry]); setQuestion(''); setPhoto(null); setError(''); setBusy(true)
    try {
      const response = await chatApi.send({ message: prompt, profileId: sentProfileId, history: messages, reportId: attachedReportId, file: attachment })
      if (activeProfileRef.current === sentProfileId) updateMessages(current => [...current, { sender: 'ai', text: response.answer }])
    } catch (problem) { if (activeProfileRef.current === sentProfileId) { updateMessages(current => current.filter(item => item !== userEntry)); setError(problem.message) } }
    finally { setBusy(false) }
  }

  return <div className="chat-screen">
    <section className="assistant-conversation" aria-label="Conversation">
      {!messages.length ? <div className="assistant-welcome"><span className="assistant-mark"><Icon name="spark" size={22}/></span><p className="eyebrow">HealthyBe AI · {activeMember?.name || 'My profile'}</p><h1>Hello, {activeMember?.name || 'there'}</h1><p className="assistant-subtitle">What would you like help understanding today?</p><div className="assistant-suggestions">{['Help me understand a health report', 'What should I ask my doctor?', 'Explain a medical term simply'].map(item => <button key={item} type="button" onClick={() => setQuestion(item)}>{item}</button>)}</div></div> : <div className="assistant-messages">{messages.map((message, index) => <article className={`assistant-message ${message.sender}`} key={`${index}-${message.sender}`}><span className="assistant-message-label">{message.sender === 'user' ? 'You' : 'HealthyBe AI'}</span>{message.sender === 'ai' ? <FormattedAnswer text={message.text}/> : <p>{message.text}</p>}</article>)}{busy && <p className="assistant-typing" role="status">HealthyBe AI is thinking…</p>}{error && <p className="form-error" role="alert">{error}</p>}<div ref={bottom}/></div>}
    </section>
    <div className="assistant-composer-wrap">
      {openFiles && <section className="assistant-file-menu glass"><div className="assistant-file-menu-head"><strong>Files for {activeMember?.name || 'selected profile'}</strong><Link to="/dashboard" onClick={() => setOpenFiles(false)}>Manage uploads</Link></div><div className="assistant-file-list">{profileReports.length ? profileReports.map(report => <button key={report.id} type="button" className={report.id === reportId ? 'selected' : ''} onClick={() => { setReportId(report.id); setPhoto(null); setOpenFiles(false) }}><Icon name={report.type === 'IMAGE' ? 'camera' : 'file'} size={16}/><span>{report.name}</span></button>) : <p>No reports for this profile. <Link to="/dashboard">Upload one</Link></p>}</div><button className="assistant-upload-action" type="button" onClick={() => fileInput.current?.click()}><Icon name="upload" size={15}/> Upload a new file</button></section>}
      {(photo || selectedReport) && <div className="assistant-attachment"><Icon name={(photo?.type || selectedReport?.mimeType || '').startsWith('image/') ? 'camera' : 'file'} size={15}/><span>{photo?.name || selectedReport?.name}</span><button className="text-btn" type="button" onClick={() => { setPhoto(null); setReportId('') }}>Remove</button></div>}
      <form className="assistant-composer" onSubmit={send}>
        <input ref={fileInput} className="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => { setPhoto(event.target.files?.[0] || null); setReportId(''); setOpenFiles(false); event.target.value = '' }}/>
        <input ref={cameraInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={event => { setPhoto(event.target.files?.[0] || null); setReportId(''); setOpenFiles(false); event.target.value = '' }}/>
        <button className="attach" type="button" aria-label="Choose a report" aria-expanded={openFiles} onClick={() => setOpenFiles(value => !value)}><Icon name="file" size={19}/></button>
        <button className="attach" type="button" aria-label="Take a report photo" onClick={() => cameraInput.current?.click()}><Icon name="camera" size={19}/></button>
        <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask a health question…" aria-label="Ask a health question"/>
        <button className="send" type="submit" aria-label="Send question" disabled={busy || (!question.trim() && !photo && !selectedReport)}><Icon name="send" size={18}/></button>
      </form>
      <p className="assistant-note">Helpful health information, not a diagnosis or a substitute for a clinician.</p>
    </div>
  </div>
}
