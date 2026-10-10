import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const activeReports = reports.filter(r => r.profileId === activeProfileId)

  // Session & Message states
  const [currentSessionId, setCurrentSessionId] = useState(() => searchParams.get('sessionId') || null)
  const [sessionTitle, setSessionTitle] = useState('')
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isImageMode, setIsImageMode] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [error, setError] = useState('')

  // History Drawer & Past Sessions
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [sessionsList, setSessionsList] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeLightboxImage, setActiveLightboxImage] = useState(null)

  const chatBottomRef = useRef(null)
  const firstName = activeProfile?.name?.split(' ')[0] || 'Friend'

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isGeneratingImage])

  // Fetch list of previous sessions for drawer
  const fetchSessionsList = async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/chat/sessions`, {
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        const data = await res.json()
        setSessionsList(data.sessions || [])
      }
    } catch (err) {
      console.warn('Could not load chat sessions list:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // Load specific session when currentSessionId is present or changes
  useEffect(() => {
    const urlSessionId = searchParams.get('sessionId')
    if (urlSessionId && urlSessionId !== currentSessionId) {
      setCurrentSessionId(urlSessionId)
    }
  }, [searchParams])

  useEffect(() => {
    if (!currentSessionId) return

    const loadSession = async () => {
      setIsTyping(true)
      try {
        const res = await fetch(`${apiBase}/api/chat/sessions/${currentSessionId}`, {
          headers: { 'x-user-email': userEmail || 'self' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.session) {
            setSessionTitle(data.session.title || '')
            if (data.session.messages && data.session.messages.length > 0) {
              setMessages(data.session.messages)
            }
          }
        }
      } catch (err) {
        console.error('Error loading session:', err)
      } finally {
        setIsTyping(false)
      }
    }

    loadSession()
  }, [currentSessionId])

  useEffect(() => {
    if (historyDrawerOpen) {
      fetchSessionsList()
    }
  }, [historyDrawerOpen])

  /* ── Build health context string for Gemini ── */
  const buildHealthContext = (reportObj = null) => {
    const profile = activeProfile
    const lines = []

    if (profile?.name) {
      lines.push(`Patient: ${profile.name} (${profile.relation || 'Self'}), Age: ${profile.age || 'unknown'}`)
    }

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

  /* ── Call Gemini text API ── */
  const callGeminiAPI = async (userText, fileObj = null) => {
    const healthContext = buildHealthContext(fileObj)
    const messageWithFileHint = fileObj
      ? `[File Attached: ${fileObj.name}]\n${userText}`
      : userText

    const response = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail || 'self'
      },
      body: JSON.stringify({
        message: messageWithFileHint,
        context: healthContext,
        language: preferences?.language || 'English',
        sessionId: currentSessionId,
        profileId: activeProfileId || 'self',
        profileName: activeProfile?.name || 'Self',
        attachedReportName: fileObj ? fileObj.name : null
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${response.status}`)
    }

    const data = await response.json()
    if (data.sessionId && data.sessionId !== currentSessionId) {
      setCurrentSessionId(data.sessionId)
      setSearchParams({ sessionId: data.sessionId })
    }
    return data.reply
  }

  /* ── Call Medical Image Generation API ── */
  const callGenerateImageAPI = async (prompt) => {
    const healthContext = buildHealthContext()
    setIsGeneratingImage(true)
    setError('')

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      sender: 'user',
      text: `🎨 Generate Image: "${prompt}"`,
      time: timeNow
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch(`${apiBase}/api/chat/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || 'self'
        },
        body: JSON.stringify({
          prompt,
          context: healthContext,
          sessionId: currentSessionId,
          profileId: activeProfileId || 'self',
          profileName: activeProfile?.name || 'Self'
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Image generation failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId)
        setSearchParams({ sessionId: data.sessionId })
      }

      const aiMsg = {
        sender: 'ai',
        text: data.visual?.caption || 'Generated medical visual.',
        time: timeNow,
        isImage: true,
        imageUrl: data.visual?.imageUrl,
        imagePrompt: data.visual?.originalPrompt || prompt,
        imageCaption: data.visual?.caption,
        imageTags: data.visual?.tags || []
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setError(`Image Generation Error: ${err.message}`)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ Could not generate image: ${err.message}. Please try again.`,
          time: timeNow
        }
      ])
    } finally {
      setIsGeneratingImage(false)
      setIsImageMode(false)
    }
  }

  /* ── Send message handler ── */
  const sendMessage = async (text, fileObj = null) => {
    // Check if user is in Image Mode or explicitly asks for image
    const lower = text.trim().toLowerCase()
    const isExplicitImageCommand = lower.startsWith('/image ') || lower.startsWith('/img ') || lower.startsWith('generate image of ') || lower.startsWith('create image of ')

    if (isImageMode || isExplicitImageCommand) {
      const cleanPrompt = text
        .replace(/^\/image\s+/i, '')
        .replace(/^\/img\s+/i, '')
        .replace(/^generate image of\s+/i, '')
        .replace(/^create image of\s+/i, '')
        .trim()
      await callGenerateImageAPI(cleanPrompt || text)
      return
    }

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
          text: `⚠️ I encountered an issue: ${err.message}. Please check your backend service.`,
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
      : inputVal.trim()

    sendMessage(textToSend, attachedFile)
    setInputVal('')
    setAttachedFile(null)
  }

  const handleSuggestionClick = (prompt, isImage = false) => {
    if (isTyping || isGeneratingImage) return
    if (isImage) {
      callGenerateImageAPI(prompt)
    } else {
      sendMessage(prompt, null)
    }
  }

  const handleFileSelect = (report) => {
    setAttachedFile(report)
    setShowFilePicker(false)
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setSessionTitle('')
    setSearchParams({})
    setMessages([
      {
        sender: 'ai',
        text: 'chat.greeting',
        isTranslationKey: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setAttachedFile(null)
    setError('')
    setHistoryDrawerOpen(false)
  }

  const selectPastSession = (sessionId) => {
    setCurrentSessionId(sessionId)
    setSearchParams({ sessionId })
    setHistoryDrawerOpen(false)
  }

  const deletePastSession = async (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation history?')) return

    try {
      const res = await fetch(`${apiBase}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        setSessionsList(prev => prev.filter(s => s.id !== sessionId && s._id !== sessionId))
        if (currentSessionId === sessionId) {
          startNewChat()
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  // Suggestion sets
  const clinicalSuggestions = [
    { text: t('chat.sug1Text'), prompt: t('chat.sug1Prompt') },
    { text: t('chat.sug2Text'), prompt: t('chat.sug2Prompt') },
    { text: t('chat.sug3Text'), prompt: t('chat.sug3Prompt') },
    { text: t('chat.sug4Text'), prompt: t('chat.sug4Prompt') }
  ]

  const visualSuggestions = [
    { title: 'Heart Circulation', prompt: 'Detailed 3D anatomical diagram of human heart chambers and blood circulation', icon: '🫀' },
    { title: 'Healthy Diet Plate', prompt: 'Vibrant Mediterranean diet balanced meal plate with salmon, greens, quinoa, and olive oil', icon: '🥗' },
    { title: 'Ergonomic Posture', prompt: 'Medical infographic showing healthy spinal alignment and ergonomic sitting posture', icon: '🧘' },
    { title: 'Hydration Guide', prompt: 'Clean cellular hydration and daily electrolytes intake educational chart', icon: '💧' }
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
    let listType = null

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

      {/* Ambient Glows */}
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-teal-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

      {/* ── PREVIOUS CHATS SLIDE-OVER DRAWER ── */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setHistoryDrawerOpen(false)}
          />

          <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-950 border-r border-slate-800 h-full p-5 flex flex-col z-10 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <h3 className="text-sm font-black text-slate-100 font-mono uppercase tracking-wider">
                  Previous Chats
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="py-4 space-y-2 border-b border-slate-900">
              <button
                type="button"
                onClick={startNewChat}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>+</span>
                <span>Start New Consultation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHistoryDrawerOpen(false)
                  navigate('/dashboard?tab=chat')
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-400 border border-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>📊 Open Full History Dashboard</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
              {sessionsLoading ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-5 h-5 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin mx-auto" />
                  <p className="text-[10px] text-slate-500 font-mono">Loading consultations...</p>
                </div>
              ) : sessionsList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No previous consultations recorded yet.
                </div>
              ) : (
                sessionsList.map(session => {
                  const isActive = currentSessionId === session.id || currentSessionId === session._id
                  const formattedDate = session.lastMessageAt
                    ? new Date(session.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ''

                  return (
                    <div
                      key={session.id || session._id}
                      onClick={() => selectPastSession(session.id || session._id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                        isActive
                          ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          {session.hasImages && <span className="text-[10px]">🎨</span>}
                          <h4 className="text-xs font-bold truncate group-hover:text-teal-300 transition-colors">
                            {session.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                          <span>{session.profileName}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => deletePastSession(e, session.id || session._id)}
                        className="text-slate-600 hover:text-rose-400 p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete session"
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CHAT VIEW CONTAINER ── */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-start overflow-hidden relative z-10">

        {/* Top Header Bar */}
        <div className="py-1 shrink-0 flex justify-between items-center w-full min-h-[30px] border-b border-slate-900/60 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors md:invisible"
              aria-label="Go Back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* History Drawer Trigger */}
            <button
              type="button"
              onClick={() => setHistoryDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <span>📜</span>
              <span>Past Chats</span>
              {sessionsList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  {sessionsList.length}
                </span>
              )}
            </button>

            {currentSessionId && (
              <button
                type="button"
                onClick={startNewChat}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-950/40 border border-teal-900/50 text-teal-400 hover:text-teal-300 text-xs font-bold transition-all"
              >
                <span>+</span>
                <span>New Chat</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Image Mode Status Indicator */}
            {isImageMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] font-bold text-purple-300 animate-pulse">
                <span>🎨 Visual Mode Active</span>
              </span>
            )}

            {messages.length > 1 && (
              <button
                onClick={startNewChat}
                className="text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/80 to-red-900/80 hover:from-red-600 hover:to-red-900 text-white active:scale-95 transition-all shadow-md"
              >
                Clear
              </button>
            )}
          </div>
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
                <p className="text-base sm:text-lg font-bold text-slate-500 tracking-tight">
                  Consult clinical reports, ask health advice, or generate medical infographics
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="w-full max-w-3xl space-y-4 py-2">
                {/* Clinical Advice Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clinicalSuggestions.slice(0, 2).map((sug, idx) => (
                    <Card
                      key={`clin-${idx}`}
                      onClick={() => !isTyping && handleSuggestionClick(sug.prompt)}
                      className="p-4 text-left bg-slate-950/40 border border-slate-900/80 hover:bg-slate-900/60 hover:border-teal-500/30 cursor-pointer flex flex-col justify-between h-24 group transition-all duration-300"
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

                {/* Visual Image Generation Suggestions */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <span>🎨</span>
                      <span>Generate Health Visuals & Infographics</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">AI Visuals</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visualSuggestions.map((vis, idx) => (
                      <Card
                        key={`vis-${idx}`}
                        onClick={() => !isGeneratingImage && handleSuggestionClick(vis.prompt, true)}
                        className="p-4 text-left bg-gradient-to-tr from-purple-950/20 via-slate-950/40 to-slate-950 border border-purple-900/30 hover:border-purple-500/40 hover:bg-purple-950/30 cursor-pointer flex flex-col justify-between h-24 group transition-all duration-300"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{vis.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                              {vis.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {vis.prompt}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-purple-400/80 group-hover:text-purple-300 font-bold self-end transition-colors flex items-center gap-1 font-mono">
                          GENERATE IMAGE <span>🎨</span>
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
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
                    {msg.isImage ? (
                      /* ── GENERATED IMAGE CARD IN CHAT ── */
                      <div className="space-y-3 max-w-xl">
                        <div className="rounded-2xl overflow-hidden border border-purple-900/40 bg-slate-950 shadow-2xl relative group">
                          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                            <img
                              src={msg.imageUrl}
                              alt={msg.imagePrompt || 'Medical visual'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setActiveLightboxImage({ url: msg.imageUrl, title: msg.imagePrompt, caption: msg.imageCaption })}
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30">
                                🎨 AI Visual
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveLightboxImage({ url: msg.imageUrl, title: msg.imagePrompt, caption: msg.imageCaption })}
                              className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[10px] text-white font-bold hover:bg-black/90 transition-all flex items-center gap-1"
                            >
                              <span>🔍</span>
                              <span>Expand</span>
                            </button>
                          </div>

                          <div className="p-4 space-y-2">
                            {msg.imagePrompt && (
                              <h4 className="text-xs font-bold text-slate-100">
                                {msg.imagePrompt}
                              </h4>
                            )}
                            {msg.imageCaption && (
                              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                {msg.imageCaption}
                              </p>
                            )}
                            {msg.imageTags && msg.imageTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {msg.imageTags.map((tag, tIdx) => (
                                  <span key={tIdx} className="text-[8px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-purple-300">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : msg.sender === 'user' ? (
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

          {/* Typing Indicator for Text */}
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

          {/* Generating Indicator for Images */}
          {isGeneratingImage && (
            <div className="flex gap-4 items-start w-full mt-4 animate-fade-in">
              <div className="w-8 h-8 rounded-full border border-purple-800 flex items-center justify-center bg-slate-950 shadow-md overflow-hidden flex-shrink-0 mt-1">
                <span className="text-xs">🎨</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-2 max-w-sm">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
                  <span>Generating Health Visual...</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Synthesizing clinical anatomy, lighting, and medical diagram details.
                </p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ── BOTTOM INPUT BAR ── */}
        <div className="w-full max-w-3xl mx-auto space-y-1.5 shrink-0 pt-0.5 relative">
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between animate-fade-in">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold ml-2">✕</button>
            </div>
          )}

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
            <div className={`chat-input-capsule flex-1 bg-gradient-to-r ${
              isImageMode
                ? 'from-purple-950/40 via-slate-900/80 to-indigo-950/40 border-purple-500/60 ring-2 ring-purple-900/30'
                : 'from-teal-950/20 via-slate-900/60 to-cyan-950/20 border-slate-800/80'
            } border rounded-full py-1 pl-2 pr-2 flex items-center justify-between focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-950/30 transition-all duration-300 shadow-lg backdrop-blur-md min-w-0`}>

              {/* Attachment Button */}
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

              {/* Generate Image Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsImageMode(!isImageMode)}
                title={isImageMode ? 'Switch back to Text Consultation' : 'Switch to Image Generation Mode'}
                className={`w-8 h-8 rounded-full ml-1 transition-all flex items-center justify-center shrink-0 text-sm ${
                  isImageMode
                    ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/50 scale-105'
                    : 'bg-slate-800/40 text-slate-400 hover:text-purple-300 hover:bg-slate-800/70'
                }`}
              >
                🎨
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
                placeholder={
                  isImageMode
                    ? 'Describe health image to generate (e.g. Heart circulation, balanced keto meal, spine posture)...'
                    : attachedFile
                    ? t('chat.promptPlaceholder')
                    : t('chat.placeholder')
                }
                className="chat-input-field flex-1 bg-transparent text-xs px-2 py-1 text-slate-200 focus:outline-none placeholder:text-slate-500"
                disabled={isTyping || isGeneratingImage}
              />

              <button
                type="submit"
                disabled={(!inputVal.trim() && !attachedFile) || isTyping || isGeneratingImage}
                className={`chat-btn-send w-8 h-8 ${
                  isImageMode
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black'
                } disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-extrabold text-xs rounded-full flex items-center justify-center transition-all shadow-md shrink-0`}
              >
                {isTyping || isGeneratingImage ? (
                  <svg className="animate-spin w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isImageMode ? '✨' : '➔'}
              </button>
            </div>
          </form>

          <div className="text-[9px] text-slate-600 text-center leading-normal">
            {isImageMode
              ? 'AI generates clinical diagrams and wellness visuals. Click 🎨 again to return to clinical chat.'
              : t('chat.disclaimer')}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX MODAL FOR EXPANDED IMAGES ── */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                  {activeLightboxImage.title || 'Medical Infographic'}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">HealthyBe AI High-Resolution Visual</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeLightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="healthybe-visual.jpg"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold border border-slate-800 flex items-center gap-1.5"
                >
                  <span>⬇️</span>
                  <span>Save Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.title || 'Medical visual'}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {activeLightboxImage.caption && (
              <div className="p-4 bg-slate-950 border-t border-slate-900 text-xs text-slate-300 leading-relaxed">
                💡 <span className="font-semibold text-teal-300">Clinical Context:</span> {activeLightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
