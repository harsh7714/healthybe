import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useTranslation } from '../utils/translationService'

function Chat() {
  const {
    family,
    reports,
    getReportAnalysis,
    activeProfile,
    activeProfileId,
    preferences,
    userEmail
  } = useHealth()

  const navigate = useNavigate()

  const { t } = useTranslation()

  const activeReports = reports.filter(r => r.profileId === activeProfileId)

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'chat.greeting',
      isTranslationKey: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [error, setError] = useState('')
  const chatBottomRef = useRef(null)

  const firstName = activeProfile?.name?.split(' ')[0] || 'Friend'

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  /* ── Build health context string for Gemini ── */
  const buildHealthContext = (reportObj = null) => {
    const profile = activeProfile
    const lines = []

    if (profile?.name) {
      lines.push(`Patient: ${profile.name} (${profile.relation || 'Self'}), Age: ${profile.age || 'unknown'}`)
    }

    // Include all reports for the active profile
    const reportsToInclude = reportObj
      ? [reportObj, ...activeReports.filter(r => r.id !== reportObj.id)]
      : activeReports

    if (reportsToInclude.length > 0) {
      lines.push(`\nHealth Reports (${reportsToInclude.length} total):`)
      reportsToInclude.forEach(r => {
        const data = getReportAnalysis(r.name)
        if (data) {
          lines.push(`\n--- ${r.name} (${r.date || 'recent'}) ---`)

          if (data.vitals && Object.keys(data.vitals).length > 0) {
            lines.push('Vitals:')
            Object.entries(data.vitals).forEach(([name, stat]) => {
              lines.push(`  • ${name}: ${stat.value} ${stat.unit} (${stat.status})`)
            })
          }

          if (data.metrics && data.metrics.length > 0) {
            lines.push('Lab Markers:')
            data.metrics.forEach(m => {
              lines.push(`  • ${m.name}: ${m.value} ${m.unit} — ${m.status}`)
            })
          }

          if (data.medications && data.medications.length > 0) {
            lines.push('Medications:')
            data.medications.forEach(med => {
              lines.push(`  • ${med.name} ${med.dose} — ${med.freq} [${med.status}]`)
            })
          }

          if (data.checkup?.findings) {
            lines.push(`Findings: ${data.checkup.findings}`)
          }

          if (data.diet && data.diet.length > 0) {
            lines.push(`Dietary notes: ${data.diet.slice(0, 2).join('; ')}`)
          }
        }
      })
    } else {
      lines.push('No health reports uploaded yet.')
    }

    return lines.join('\n') || 'No patient data available.'
  }

  /* ── Call real Gemini 2.5 Flash API ── */
  const callGeminiAPI = async (userText, fileObj = null) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const healthContext = buildHealthContext(fileObj)

    const messageWithFileHint = fileObj
      ? `[User attached report: "${fileObj.name}"]\n${userText}`
      : userText

    const response = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail || ''
      },
      body: JSON.stringify({
        message: messageWithFileHint,
        context: healthContext,
        language: preferences?.language || 'English'
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${response.status}`)
    }

    const data = await response.json()
    return data.reply
  }

  /* ── Send message handler ── */
  const sendMessage = async (text, fileObj = null) => {
    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setError('')

    try {
      const reply = await callGeminiAPI(text, fileObj)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err) {
      setError(`AI error: ${err.message}`)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ I encountered an issue: ${err.message}. Please check your Gemini API key in the backend .env file.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = (e) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() && !attachedFile) return

    const textToSend = attachedFile
      ? `[File Attached: ${attachedFile.name}]\n${inputVal.trim() || 'Analyze this report.'}`
      : inputVal

    sendMessage(textToSend, attachedFile)
    setInputVal('')
    setAttachedFile(null)
  }

  const handleSuggestionClick = (prompt) => {
    if (isTyping) return
    sendMessage(prompt, null)
  }

  const handleFileSelect = (report) => {
    setAttachedFile(report)
    setShowFilePicker(false)
  }

  const clearChat = () => {
    setMessages([{
      sender: 'ai',
      text: 'chat.cleared',
      isTranslationKey: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
    setAttachedFile(null)
    setError('')
  }

  const suggestions = [
    { text: t('chat.sug1Text'), prompt: t('chat.sug1Prompt') },
    { text: t('chat.sug2Text'), prompt: t('chat.sug2Prompt') },
    { text: t('chat.sug3Text'), prompt: t('chat.sug3Prompt') },
    { text: t('chat.sug4Text'), prompt: t('chat.sug4Prompt') }
  ]

  /* ── Inline Markdown Bold Parser ── */
  const parseInline = (text) => {
    if (!text) return ''
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  /* ── Structured Markdown Renderer ── */
  const renderMarkdown = (text) => {
    if (!text) return null
    
    const lines = text.split('\n')
    const elements = []
    let currentList = []
    let listType = null // 'ul' or 'ol'
    
    const flushList = (key) => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-300">
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ul>
          )
        } else if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1 text-slate-300">
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ol>
          )
        }
        currentList = []
        listType = null
      }
    }
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('### ')) {
        flushList(index)
        elements.push(
          <h4 key={index} className="text-sm font-bold text-teal-400 mt-4 mb-2 tracking-wide uppercase font-mono">
            {parseInline(trimmed.substring(4))}
          </h4>
        )
      } else if (trimmed.startsWith('## ')) {
        flushList(index)
        elements.push(
          <h3 key={index} className="text-base font-black text-teal-300 mt-5 mb-2 tracking-tight">
            {parseInline(trimmed.substring(3))}
          </h3>
        )
      } else if (trimmed.startsWith('# ')) {
        flushList(index)
        elements.push(
          <h2 key={index} className="text-lg font-black text-white mt-6 mb-3 tracking-tight">
            {parseInline(trimmed.substring(2))}
          </h2>
        )
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList(index)
          listType = 'ul'
        }
        currentList.push(trimmed.substring(2))
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList(index)
          listType = 'ol'
        }
        const content = trimmed.substring(trimmed.indexOf('.') + 1).trim()
        currentList.push(content)
      } else if (trimmed === '') {
        flushList(index)
      } else {
        flushList(index)
        elements.push(
          <p key={index} className="mb-3 leading-relaxed text-slate-300">
            {parseInline(line)}
          </p>
        )
      }
    })
    
    flushList('end')
    return elements
  }

  return (
    <div className="bg-[#0B0F19] text-slate-100 h-[100dvh] md:h-screen flex flex-col justify-start pt-3 md:pt-20 lg:pt-24 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-6 px-3 sm:px-6 lg:px-8 overflow-hidden relative">

      {/* Background Ambient Glows */}
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-teal-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-start overflow-hidden relative z-10">

        {/* Chat Page Header (Back arrow on mobile, Clear Chat on all screens) */}
        <div className="py-1 shrink-0 flex justify-between items-center w-full min-h-[24px]">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors md:invisible"
            aria-label="Go Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-900 text-white active:scale-95 transition-all hover:brightness-110 shadow-md"
            >
              {t('chat.clearBtn')}
            </button>
          )}
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 no-scrollbar py-2 flex flex-col min-h-0">
          {messages.length <= 1 ? (
            <div className="my-auto py-6 sm:py-8 space-y-6 flex flex-col items-center justify-center w-full">
              {/* Welcome Banner */}
              <div className="text-center space-y-2.5 shrink-0">
                <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight animate-fade-in">
                  {t('chat.hello')}{firstName}
                </h2>
                <p className="text-lg sm:text-xl font-bold text-slate-500 tracking-tight">
                  {t('chat.howCanIHelp')}
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mx-auto py-4">
                {suggestions.map((sug, idx) => (
                  <Card
                    key={idx}
                    onClick={() => !isTyping && handleSuggestionClick(sug.prompt)}
                    className="p-5 text-left bg-slate-950/30 border border-slate-900/80 hover:bg-slate-900/60 hover:border-slate-800 cursor-pointer flex flex-col justify-between h-28 sm:h-32 group transition-all duration-300"
                  >
                    <p className="text-xs font-semibold text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                      {sug.text}
                    </p>
                    <span className="text-[10px] text-slate-500 group-hover:text-teal-400 font-bold self-end transition-colors flex items-center gap-1 font-mono">
                      ASK AI <span>→</span>
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 items-start w-full ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950 shadow-md overflow-hidden flex-shrink-0 mt-1">
                      <img src="/favicon.ico" alt="HealthyBe AI Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                  )}
                  <div className={`leading-relaxed text-sm ${
                    msg.sender === 'user'
                      ? 'chat-bubble-user bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 px-5 py-3 rounded-2xl text-slate-200 max-w-lg shadow-md'
                      : 'chat-bubble-ai text-slate-300 flex-1 py-1'
                  }`}>
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-line font-medium leading-relaxed">{parseInline(msg.text)}</p>
                    ) : (
                      <div className="space-y-1">{renderMarkdown(msg.isTranslationKey ? t(msg.text) : msg.text)}</div>
                    )}
                    <span className="block text-[8px] text-slate-500 mt-2 font-mono tracking-wider">{msg.time}</span>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="chat-user-avatar w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 font-bold text-[10px] flex-shrink-0 shadow-md mt-1 overflow-hidden">
                      {activeProfile?.profileImageUrl ? (
                        <img src={activeProfile?.profileImageUrl} alt={activeProfile?.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        activeProfile?.initials || '?'
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-4 items-start w-full mt-4">
              <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950 shadow-md overflow-hidden flex-shrink-0 mt-1">
                <img src="/favicon.ico" alt="HealthyBe AI Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="py-2.5 flex items-center gap-2 text-slate-500 font-semibold text-xs">
                <span>{t('chat.thinking')}</span>
                <div className="flex gap-1.5 items-center pt-0.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Input Bar */}
        <div className="w-full max-w-3xl mx-auto space-y-1.5 shrink-0 pt-0.5 relative">



          {/* File Picker Popover */}
          {showFilePicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilePicker(false)} />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-16 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-slate-950 border border-slate-900 rounded-2xl p-4 shadow-2xl z-20 animate-fade-in space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Vault Clinical Reports</span>
                  <span className="text-[9px] text-teal-400 font-bold font-mono">INDEXED</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar text-left">
                  {activeReports.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center font-mono">No reports in vault</p>
                  ) : (
                    activeReports.map((r, rIdx) => {
                      const profile = family.find(f => f.id === r.profileId)
                      return (
                        <button
                          key={r.id || rIdx}
                          type="button"
                          onClick={() => handleFileSelect(r)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-800 transition-all flex items-center gap-3 group"
                        >
                          <span className="text-lg group-hover:scale-110 transition-transform duration-300">📄</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{r.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">Patient: {profile?.name || 'Unknown'}</p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSend} className="flex gap-2 relative w-full items-center">
            <div className="chat-input-capsule flex-1 bg-gradient-to-r from-teal-950/20 via-slate-900/60 to-cyan-950/20 border border-slate-800/80 rounded-full py-1 pl-2 pr-2 flex items-center justify-between focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-950/30 transition-all duration-300 shadow-lg backdrop-blur-md min-w-0">

              <button
                type="button"
                onClick={() => setShowFilePicker(!showFilePicker)}
                className={`chat-btn-attach w-8 h-8 rounded-full transition-all text-base font-black flex items-center justify-center shrink-0 ${
                  showFilePicker
                    ? 'chat-btn-attach-active bg-teal-950/60 text-teal-400'
                    : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Select report to analyze"
              >
                +
              </button>

              {attachedFile && (
                <div className="flex items-center gap-1 bg-teal-950/60 border border-teal-900/60 rounded-full px-2 py-0.5 text-[9px] font-bold text-teal-400 select-none animate-fade-in shrink-0 ml-1 shadow-sm max-w-[110px] xs:max-w-[150px] sm:max-w-[200px]">
                  <span className="truncate">📄 {attachedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-teal-600 hover:text-rose-400 font-extrabold text-[9px] ml-1 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={attachedFile ? t('chat.promptPlaceholder') : t('chat.placeholder')}
                className="chat-input-field flex-1 bg-transparent text-xs px-2 py-1 text-slate-200 focus:outline-none placeholder:text-slate-500"
                disabled={isTyping}
              />

              <button
                type="submit"
                disabled={(!inputVal.trim() && !attachedFile) || isTyping}
                className="chat-btn-send w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 text-black disabled:text-slate-600 font-extrabold text-xs rounded-full flex items-center justify-center transition-all shadow-md shrink-0"
              >
                {isTyping ? (
                  <svg className="animate-spin w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '➔'}
              </button>
            </div>
          </form>

          <div className="text-[9px] text-slate-600 text-center leading-normal">
            {t('chat.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
